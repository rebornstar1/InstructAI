package com.screening.interviews.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.mapper.InterviewMapper;
import com.screening.interviews.dto.*;
import com.screening.interviews.model.*;
import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.enums.InterviewStatus;
import com.screening.interviews.repo.*;
import io.jsonwebtoken.CompressionCodecs;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import com.screening.interviews.mapper.InterviewMapper;

@Slf4j
@Service
public class InterviewService {
    private final GoogleCalendarService googleCalendarService;


    private static final Logger logger = LoggerFactory.getLogger(InterviewService.class);

    private final InterviewRepository interviewRepository;
    private final InterviewersInterviewRepository interviewersInterviewRepository;
    private final JavaMailSender mailSender;
    private final AIFeedbackService aiFeedbackService;

    private static final String JWT_SECRET = "S3cr3tK3yForJWTValidationAtLeast32BytetulipJWT";
    private static final long EXPIRATION_TIME = 3600 * 1000; // 1 hour

    private final SecureRandom secureRandom = new SecureRandom();
    private final InterviewMapper interviewMapper;
    private final CandidateRepository candidateRepository;
    private final CandidateJobRepository candidateJobRepository;
    private final JobRepository jobRepository;

    @Autowired
    public InterviewService(GoogleCalendarService googleCalendarService, InterviewRepository interviewRepository,
                            InterviewersInterviewRepository interviewersInterviewRepository,
                            JavaMailSender mailSender,
                            AIFeedbackService aiFeedbackService,
                            InterviewMapper interviewMapper,
    CandidateRepository candidateRepository,CandidateJobRepository candidateJobRepository,JobRepository jobRepository) {
        this.googleCalendarService = googleCalendarService;
        this.interviewRepository = interviewRepository;
        this.interviewersInterviewRepository = interviewersInterviewRepository;
        this.mailSender = mailSender;
        this.aiFeedbackService = aiFeedbackService;
        this.interviewMapper = interviewMapper;
        this.candidateRepository = candidateRepository;
        this.candidateJobRepository = candidateJobRepository;
        this.jobRepository = jobRepository;
    }

    @Transactional
    public InterviewResponseDto createInterview(CreateInterviewDto dto) {
        logger.info("=== Starting createInterview process ===");
        logger.info("Candidate ID: {}, Candidate Email: {}, Position: {}",
                dto.getCandidateId(), dto.getCandidateEmail(), dto.getPosition());

        try {
            // Validate required fields
            if (dto.getCandidateEmail() == null || dto.getCandidateEmail().trim().isEmpty()) {
                throw new IllegalArgumentException("Candidate email is required");
            }

            if (dto.getJobId() == null) {
                throw new IllegalArgumentException("Job ID is required");
            }

            if (dto.getInterviewDate() == null) {
                throw new IllegalArgumentException("Interview date is required");
            }

            // Find or create candidate
            Candidate candidate = candidateRepository.findByEmail(dto.getCandidateEmail())
                    .orElseGet(() -> {
                        Candidate newCandidate = Candidate.builder()
                                .fullName(dto.getCandidateEmail())  // Ideally, pass full name
                                .email(dto.getCandidateEmail())
                                .resumeContent(dto.getResumeContent())
                                .resumeSummary(dto.getResumeSummary())
                                .build();
                        return candidateRepository.save(newCandidate);
                    });

            // Find job with proper error message
            Job job = jobRepository.findById(dto.getJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job not found with ID: " + dto.getJobId()));

            // Find or create candidateJob
            CandidateJob candidateJob = candidateJobRepository.findByCandidateAndJob(candidate, job)
                    .orElseGet(() -> {
                        CandidateJob newCandidateJob = CandidateJob.builder()
                                .candidate(candidate)
                                .job(job)
                                .currentRound(1)
                                .status("Applied")
                                .build();
                        return candidateJobRepository.save(newCandidateJob);
                    });

            // Check if there are existing interviews for this candidate-job
            boolean isExistingCandidateJob = candidateJob.getId() != null;
            List<Interview> existingInterviews = Collections.emptyList();
            Interview previousInterview = null;
            Integer roundNumber = 1;

            if (isExistingCandidateJob) {
                existingInterviews = interviewRepository.findByCandidateJobOrderByRoundNumberDesc(candidateJob);

                if (!existingInterviews.isEmpty()) {
                    // There are previous interviews, this is a subsequent round
                    previousInterview = existingInterviews.get(0);

                    // Use provided round number or auto-increment from previous
                    if (dto.getRoundNumber() != null) {
                        roundNumber = dto.getRoundNumber();
                    } else {
                        roundNumber = previousInterview.getRoundNumber() + 1;
                    }

                    logger.info("Existing interviews found. Creating round {} for candidate {} and job {}",
                            roundNumber, candidate.getId(), job.getId());
                } else {
                    // CandidateJob exists but no interviews yet, use round 1 or provided
                    roundNumber = dto.getRoundNumber() != null ? dto.getRoundNumber() : 1;
                }
            } else {
                // New candidate-job, use round 1 or provided
                roundNumber = dto.getRoundNumber() != null ? dto.getRoundNumber() : 1;
            }

            // Update candidateJob's currentRound if this is a new round
            if (roundNumber > candidateJob.getCurrentRound()) {
                candidateJob.setCurrentRound(roundNumber);
                candidateJob.setStatus("Round " +  roundNumber +" Scheduled");
                candidateJobRepository.save(candidateJob);
            }

            // Build the interview entity, reusing data from previous interview if applicable
            Interview.InterviewBuilder interviewBuilder = Interview.builder()
                    .candidateJob(candidateJob)
                    .candidateId(dto.getCandidateId())
                    .candidateEmail(dto.getCandidateEmail())
                    .jobId(dto.getJobId())
                    .roundNumber(roundNumber)
                    .interviewDate(dto.getInterviewDate())
                    .mode(dto.getMode() != null ? dto.getMode() : InterviewMode.VIRTUAL)
                    .status(dto.getStatus() != null ? dto.getStatus() : InterviewStatus.SCHEDULED);

// For position, resume content, summary, and file URL, use provided values or copy from previous interview
            if (previousInterview != null) {
                // If this is a subsequent round, reuse some data from previous round if not provided
                interviewBuilder
                        .position(dto.getPosition() != null ? dto.getPosition() : previousInterview.getPosition())
                        .resumeContent(dto.getResumeContent() != null ? dto.getResumeContent() : previousInterview.getResumeContent())
                        .resumeSummary(dto.getResumeSummary() != null ? dto.getResumeSummary() : previousInterview.getResumeSummary())
                        .resumeFileUrl(dto.getResumeFileUrl() != null ? dto.getResumeFileUrl() : previousInterview.getResumeFileUrl())
                        .resumeFileName(dto.getResumeFileName() != null ? dto.getResumeFileName() : previousInterview.getResumeFileName())
                        .resumeFileExpiresAfter(dto.getResumeFileExpiresAfter() != null ? dto.getResumeFileExpiresAfter() : previousInterview.getResumeFileExpiresAfter());

                // If email templates not provided, copy from previous (with round number updated)
                if (dto.getCandidateEmailContent() == null && previousInterview.getCandidateEmailContent() != null) {
                    String prevContent = previousInterview.getCandidateEmailContent()
                            .replace("Round " + previousInterview.getRoundNumber(), "Round " + roundNumber);
                    interviewBuilder.candidateEmailContent(prevContent);
                } else {
                    interviewBuilder.candidateEmailContent(dto.getCandidateEmailContent());
                }

                if (dto.getInterviewerEmailContent() == null && previousInterview.getInterviewerEmailContent() != null) {
                    String prevContent = previousInterview.getInterviewerEmailContent()
                            .replace("Round " + previousInterview.getRoundNumber(), "Round " + roundNumber);
                    interviewBuilder.interviewerEmailContent(prevContent);
                } else {
                    interviewBuilder.interviewerEmailContent(dto.getInterviewerEmailContent());
                }
            } else {
                // First round or no previous data available
                interviewBuilder
                        .position(dto.getPosition())
                        .resumeContent(dto.getResumeContent())
                        .resumeSummary(dto.getResumeSummary())
                        .resumeFileUrl(dto.getResumeFileUrl())
                        .resumeFileName(dto.getResumeFileName())
                        .resumeFileExpiresAfter(dto.getResumeFileExpiresAfter())
                        .candidateEmailContent(dto.getCandidateEmailContent())
                        .interviewerEmailContent(dto.getInterviewerEmailContent());
            }

            Interview interview = interviewBuilder.build();

            // Save Interview to generate an ID
            Interview savedInterview = interviewRepository.save(interview);
            logger.info("Interview saved successfully with id: {}", savedInterview.getInterviewId());

            try {
                // Create Google Calendar event and get meeting link
                String calendarEventLink = googleCalendarService.createCalendarEvent(savedInterview, dto.getInterviewers());

                // Update interview with Google Meet link if virtual
                if (savedInterview.getMode() == InterviewMode.VIRTUAL) {
                    savedInterview.setMeetingLink(calendarEventLink);
                    savedInterview = interviewRepository.save(savedInterview);
                    logger.info("Interview updated with Google Meet link: {}", calendarEventLink);
                }
            } catch (Exception e) {
                logger.error("Failed to create calendar event: {}", e.getMessage(), e);
                // Continue processing without failing the entire operation
                savedInterview.setMeetingLink("Failed to create meeting link: " + e.getMessage());
                savedInterview = interviewRepository.save(savedInterview);
            }

            // Process interviewers
            if (dto.getInterviewers() != null && !dto.getInterviewers().isEmpty()) {
                logger.info("Processing {} interviewers", dto.getInterviewers().size());
                for (InterviewerDto interviewer : dto.getInterviewers()) {
                    try {
                        // Validate interviewer data
                        if (interviewer.getUserId() == null) {
                            logger.warn("Skipping interviewer with null user ID");
                            continue;
                        }

                        if (interviewer.getEmail() == null || interviewer.getEmail().trim().isEmpty()) {
                            logger.warn("Skipping interviewer with ID {} due to missing email", interviewer.getUserId());
                            continue;
                        }

                        // Create InterviewersInterview entity
                        InterviewersInterviewId interviewerId = new InterviewersInterviewId(
                                savedInterview.getInterviewId(),
                                interviewer.getUserId()
                        );

                        InterviewersInterview interviewerInterview = new InterviewersInterview();
                        interviewerInterview.setId(interviewerId);
                        interviewerInterview.setInterview(savedInterview);
                        interviewerInterview.setName(interviewer.getName());
                        interviewerInterview.setEmail(interviewer.getEmail());


                        // Save interviewer association
                        interviewersInterviewRepository.save(interviewerInterview);
                        logger.info("Saved interviewer association: {} (ID: {})",
                                interviewer.getName(), interviewer.getUserId());

                        // Send email to interviewer
                        try {
                            String interviewerTemplate = (savedInterview.getInterviewerEmailContent() != null)
                                    ? savedInterview.getInterviewerEmailContent()
                                    : "Dear {interviewer},\n\nYou have been scheduled as an interviewer for the interview for the {position} position. Please review the details below:\n"
                                    + "Interview Round: {round}\nDate: {date}\nTime: {time}\nMode: {mode}\n\nBest regards,\nInterview Team";

                            String emailContent = interviewerTemplate
                                    .replace("{interviewer}", interviewer.getName())
                                    .replace("{position}", savedInterview.getPosition())
                                    .replace("{round}", String.valueOf(roundNumber))
                                    .replace("{date}", dto.getInterviewDate().toLocalDate().toString())
                                    .replace("{time}", dto.getInterviewDate().toLocalTime().toString())
                                    .replace("{mode}", savedInterview.getMode().name());

                            sendInterviewNotificationEmail(interviewer.getEmail(),
                                    "Interview Invitation" + (roundNumber > 1 ? " - Round " + roundNumber : ""),
                                    emailContent);
                            logger.info("Sent email notification to interviewer: {}", interviewer.getEmail());
                        } catch (Exception e) {
                            logger.error("Failed to send email to interviewer {}: {}",
                                    interviewer.getEmail(), e.getMessage(), e);
                            // Continue with other interviewers
                        }
                    } catch (Exception e) {
                        logger.error("Error processing interviewer {}: {}",
                                interviewer.getName(), e.getMessage(), e);
                        // Continue with other interviewers
                    }
                }
            }

            // Process feedback templates - always use the provided method without any conditions
            List<String> templatesToUse = new ArrayList<>();
            String method = dto.getFeedbackMethod();

            // Process based on method
            try {
                if ("ai".equalsIgnoreCase(method)) {
                    String prompt = (dto.getAiPrompt() != null && !dto.getAiPrompt().isEmpty())
                            ? dto.getAiPrompt()
                            : "Generate structured feedback templates for " +
                            (roundNumber > 1 ? "round " + roundNumber + " " : "") +
                            "interview for position: " + savedInterview.getPosition();
                    templatesToUse = aiFeedbackService.generateFeedbackTemplates(prompt, method);
                    logger.info("AI-generated feedback templates: {}", templatesToUse);
                } else if ("manual".equalsIgnoreCase(method)) {
                    if (dto.getManualFeedbackQuestions() != null && !dto.getManualFeedbackQuestions().isEmpty()) {
                        String manualPrompt = String.join("\n", dto.getManualFeedbackQuestions());
                        templatesToUse = aiFeedbackService.generateFeedbackTemplates(manualPrompt, method);
                        logger.info("Manual feedback template generated: {}", templatesToUse);
                    }
                } else if ("template".equalsIgnoreCase(method)) {
                    if (dto.getFeedbackTemplates() != null && !dto.getFeedbackTemplates().isEmpty()) {
                        templatesToUse = dto.getFeedbackTemplates();
                        logger.info("Using provided feedback templates: {}", templatesToUse);
                    }
                } else if (method != null) {
                    logger.warn("Unknown feedback method: {}. No templates will be created.", method);
                }
            } catch (Exception e) {
                logger.error("Error generating feedback templates: {}", e.getMessage(), e);
                // Continue without feedback templates
            }

            // Add feedback templates to the interview
            if (!templatesToUse.isEmpty()) {
                Interview finalSavedInterview = savedInterview;
                templatesToUse.forEach(templateStr -> {
                    FeedbackTemplate ft = FeedbackTemplate.builder()
                            .template(templateStr)
                            .interview(finalSavedInterview)
                            .build();
                    finalSavedInterview.getFeedbackTemplates().add(ft);
                });
                // Save again to persist the feedback templates
                savedInterview = interviewRepository.save(savedInterview);
                logger.info("Feedback templates saved for interview id: {}", savedInterview.getInterviewId());
            }

            try {
                // Generate secure token
                Date expiration = new Date(System.currentTimeMillis() + EXPIRATION_TIME);
                String secureToken = generateJwtToken(savedInterview.getInterviewId(),
                        savedInterview.getCandidateEmail(), expiration);
                logger.info("Secure token generated: {}", secureToken);

                // Update Interview with token details
                savedInterview.setSecureToken(secureToken);
                savedInterview.setTokenExpiration(expiration.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
                savedInterview.setEmailSent(false);
                savedInterview = interviewRepository.save(savedInterview);
                logger.info("Interview updated with token details for id: {}", savedInterview.getInterviewId());

                // Build candidate secure link and prepare email
                String candidateSecureLink = "http://localhost:3000/interview/start?token=" + secureToken;
                logger.info("Candidate secure link: {}", candidateSecureLink);

                String candidateEmailContent = savedInterview.getCandidateEmailContent();
                if (candidateEmailContent == null) {
                    candidateEmailContent = "Dear Candidate,\n\nYou have been scheduled for " +
                            (roundNumber > 1 ? "Round " + roundNumber + " " : "an ") +
                            "interview for the " + savedInterview.getPosition() + " position. " +
                            "Please click the link below to view your details:\n" +
                            candidateSecureLink + "\n\nThis link is valid for 1 hour.\n\nBest regards,\nInterview Team";
                } else if (!candidateEmailContent.contains(candidateSecureLink)) {
                    // Make sure the secure link is in the email content
                    candidateEmailContent += "\n\nAccess link: " + candidateSecureLink;
                }

                try {
                    // Send candidate email
                    sendInterviewNotificationEmail(savedInterview.getCandidateEmail(),
                            "Interview Notification" + (roundNumber > 1 ? " - Round " + roundNumber : ""),
                            candidateEmailContent);
                    logger.info("Candidate email sent successfully to: {}", savedInterview.getCandidateEmail());
                    savedInterview.setEmailSent(true);
                    savedInterview = interviewRepository.save(savedInterview);
                } catch (Exception e) {
                    logger.error("Failed to send email to candidate {}: {}",
                            savedInterview.getCandidateEmail(), e.getMessage(), e);
                    // Continue without throwing exception
                }
            } catch (Exception e) {
                logger.error("Error generating secure token or sending candidate email: {}", e.getMessage(), e);
                // Continue without throwing exception
            }

            logger.info("=== createInterview process completed successfully for interview id: {} ===",
                    savedInterview.getInterviewId());
            return interviewMapper.toDto(savedInterview);
        } catch (ResourceNotFoundException e) {
            logger.error("Resource not found during createInterview. Message: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid input during createInterview. Message: {}", e.getMessage());
            throw e;
        } catch (DataIntegrityViolationException e) {
            logger.error("Data integrity violation during createInterview. Message: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Database constraint violation: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error during createInterview process. Candidate ID: {}, Email: {}, Position: {}. Exception: {}",
                    dto.getCandidateId(), dto.getCandidateEmail(), dto.getPosition(), e.getMessage(), e);
            throw new ServiceException("Interview creation failed: " + e.getMessage(), e);
        }
    }

    // Custom exception classes for better error handling
    public class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }

    public class ServiceException extends RuntimeException {
        public ServiceException(String message, Throwable cause) {
            super(message, cause);
        }

        public ServiceException(String message) {
            super(message);
        }
    }

    private String generateJwtToken(Long interviewId, String candidateEmail, Date expirationDate) {
        Instant now = Instant.now();
        SecretKey signingKey = getSigningKey();
        String interviewIdStr = String.valueOf(interviewId);
        String encryptedInterviewId;
        try {
            encryptedInterviewId = encryptValue(interviewIdStr, signingKey);
            logger.info("Interview ID {} encrypted successfully.", interviewId);
        } catch (Exception e) {
            logger.error("Failed to encrypt interviewId: {}. Exception: {}", interviewId, e.getMessage(), e);
            throw new RuntimeException("Failed to encrypt interviewId", e);
        }

        return Jwts.builder()
                .setIssuer("interview-service")
                .setSubject(candidateEmail)
                .setIssuedAt(Date.from(now))
                .setExpiration(expirationDate)
                .claim("iidEnc", encryptedInterviewId)
                .claim("ce", candidateEmail)
                .compressWith(CompressionCodecs.DEFLATE)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    private SecretKey getSigningKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(JWT_SECRET);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException ex) {
            logger.warn("JWT_SECRET is not valid Base64. Falling back to plain text key bytes.");
            byte[] keyBytes = JWT_SECRET.getBytes(StandardCharsets.UTF_8);
            return Keys.hmacShaKeyFor(keyBytes);
        }
    }

    private String encryptValue(String plaintext, SecretKey jwtSigningKey) throws Exception {
        byte[] keyBytes = jwtSigningKey.getEncoded();
        SecretKeySpec aesKeySpec = new SecretKeySpec(keyBytes, 0, 16, "AES");

        byte[] iv = new byte[12];
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, aesKeySpec, spec);

        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

        byte[] combined = new byte[iv.length + ciphertext.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

        return Base64.getEncoder().encodeToString(combined);
    }

    private void sendInterviewNotificationEmail(String recipientEmail, String subject, String emailContent) {
        try {
            logger.info("Attempting to send email with subject '{}' to {}", subject, recipientEmail);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(emailContent);
            mailSender.send(message);
            logger.info("Email sent successfully to {}", recipientEmail);
        } catch (Exception e) {
            logger.error("Failed to send email to {}. Exception: {}", recipientEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send interview notification email: " + e.getMessage(), e);
        }
    }

//    @Transactional(readOnly = true)
//    public List<InterviewResponseDto> getAllInterviews() {
//        logger.info("Fetching all interviews from database.");
//        return interviewRepository.findAll().stream()
//                .map(interviewMapper::toDto)
//                .collect(Collectors.toList());
//    }

    public InterviewResponseDto getInterviewById(Long id) {
        logger.info("Fetching interview with id: {}", id);
        Interview interview = interviewRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Interview not found with id: " + id));
        return interviewMapper.toDto(interview);
//        if (!optionalInterview.isPresent()) {
//            logger.error("Interview not found with id: {}", id);
//            throw new RuntimeException("Interview not found with id: " + id);
//        }
//        return interviewMapper.toDto(interview);
    }

    public List<Map<String, Object>> getAllInterviews() {
        log.info("Fetching all interviews");
        try {
            List<Interview> interviews = interviewRepository.findAll();
            return interviews.stream()
                    .map(interview -> {
                        Map<String, Object> interviewMap = new HashMap<>();
                        interviewMap.put("interviewId", interview.getInterviewId());
                        interviewMap.put("jobId",interview.getJobId());
                        interviewMap.put("candidate_job_id",interview.getCandidateJob().getId());
                        interviewMap.put("candidateId", interview.getCandidateId());
                        interviewMap.put("candidateEmail", interview.getCandidateEmail());
                        interviewMap.put("position", interview.getPosition());
                        interviewMap.put("roundNumber", interview.getRoundNumber());
                        interviewMap.put("interviewDate", interview.getInterviewDate());
                        interviewMap.put("mode", interview.getMode());
                        interviewMap.put("status", interview.getStatus());
                        interviewMap.put("meetingLink", interview.getMeetingLink());
                        interviewMap.put("createdAt", interview.getCreatedAt());
                        interviewMap.put("emailSent", interview.getEmailSent());
                        interviewMap.put("interviews", interview.getInterviewers());
                        // Add resume file URL info
                        interviewMap.put("resumeFileUrl", interview.getResumeFileUrl());
                        interviewMap.put("resumeFileName", interview.getResumeFileName());
                        interviewMap.put("resumeFileExpiresAfter", interview.getResumeFileExpiresAfter());

                        return interviewMap;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching interviews: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch interviews", e);
        }
    }


    @Transactional
    public InterviewResponseDto updateInterview(Long id, UpdateInterviewDto dto) {
        logger.info("Updating interview with id: {}", id);
        // Get interview entity
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found with id: " + id));

        // Update fields if provided
        if (dto.getCandidateId() != null) {
            interview.setCandidateId(dto.getCandidateId());
        }
        if (dto.getRoundNumber() != null) {
            interview.setRoundNumber(dto.getRoundNumber());
        }
        if (dto.getInterviewDate() != null) {
            interview.setInterviewDate(dto.getInterviewDate());
        }
        if (dto.getMode() != null) {
            interview.setMode(dto.getMode());
        }
        if (dto.getMeetingLink() != null) {
            interview.setMeetingLink(dto.getMeetingLink());
        }
        if (dto.getStatus() != null) {
            interview.setStatus(dto.getStatus());
        }

        // Save and convert to DTO
        Interview updatedInterview = interviewRepository.save(interview);
        logger.info("Interview updated successfully with id: {}", updatedInterview.getInterviewId());

        return interviewMapper.toDto(updatedInterview);
    }

    public InterviewResponseDto updateInterviewStatus(Long id, InterviewStatus status) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found with id: " + id));
        interview.setStatus(status);
        interviewRepository.save(interview);
        return interviewMapper.toDto(interview);
    }

    public void deleteInterview(Long id) {
        logger.info("Deleting interview with id: {}", id);
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found with id: " + id));
//        Interview interview = getInterviewById(id);
        interviewRepository.delete(interview);
        logger.info("Interview deleted successfully with id: {}", id);
    }

    @Transactional
    public void addInterviewer(Long interviewId, AddInterviewerDto dto) {
        logger.info("Adding interviewer (userId: {}, name: {}) to interview id: {}",
                dto.getUserId(), dto.getName(), interviewId);

        // Validate input
        if (dto.getUserId() == null || dto.getName() == null || dto.getEmail() == null) {
            throw new IllegalArgumentException("Interviewer userId, name, and email are required");
        }

//        Interview interview = getInterviewById(interviewId);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found with id: " + interviewId));
        InterviewersInterviewId id = new InterviewersInterviewId(interview.getInterviewId(), dto.getUserId());

        // Check if interviewer already exists
        if (interviewersInterviewRepository.existsById(id)) {
            logger.error("Interviewer already added to interview id: {}", interviewId);
            throw new RuntimeException("Interviewer already added to interview.");
        }

        // Create and save interviewer entry
        InterviewersInterview interviewerEntry = new InterviewersInterview();
        interviewerEntry.setId(id);
        interviewerEntry.setInterview(interview);
        interviewerEntry.setName(dto.getName());
        interviewerEntry.setEmail(dto.getEmail());

        interviewersInterviewRepository.save(interviewerEntry);
        logger.info("Interviewer {} added successfully to interview id: {}", dto.getName(), interviewId);
    }

    @Transactional
    public void removeInterviewer(Long interviewId, Long userId) {
        logger.info("Removing interviewer (userId: {}) from interview id: {}", userId, interviewId);
        InterviewersInterviewId id = new InterviewersInterviewId(interviewId, userId);
        if (!interviewersInterviewRepository.existsById(id)) {
            logger.error("Interviewer not found for interview id: {}", interviewId);
            throw new RuntimeException("Interviewer not found for this interview.");
        }
        interviewersInterviewRepository.deleteById(id);
        logger.info("Interviewer removed successfully from interview id: {}", interviewId);
    }



    @Transactional
    public void hireCandidateDecision(Long interviewId, String emailContent) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found with id: " + interviewId));



        // For hiring, email is always sent.
        sendInterviewNotificationEmail(interview.getCandidateEmail(),
                "Congratulations! You are Hired", emailContent);
    }

    @Transactional
    public void rejectCandidateDecision(Long interviewId, boolean sendEmail, String emailContent) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found with id: " + interviewId));


        if (sendEmail) {
            sendInterviewNotificationEmail(interview.getCandidateEmail(),
                    "Interview Result", emailContent);
        }
    }

}
