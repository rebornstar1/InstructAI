package com.screening.interviews.service;

import com.google.api.client.http.HttpRequestInitializer;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import com.screening.interviews.dto.InterviewerDto;
import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.model.Interview;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;  // Add this import


import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.TimeZone;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import com.screening.interviews.dto.InterviewerDto;
import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.model.Interview;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;  // Add this import
import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;@Service
@RequiredArgsConstructor
public class GoogleCalendarService {
    private static final String APPLICATION_NAME = "Interview Scheduler";
    private final Calendar googleCalendar;

    public String createCalendarEvent(Interview interview, List<InterviewerDto> interviewers) {
        try {
            Event event = new Event()
                    .setSummary("Interview: " + interview.getPosition())
                    .setDescription("Interview Round " + interview.getRoundNumber() +
                            " for " + interview.getPosition());

            // Convert LocalDateTime to ZonedDateTime first
            ZonedDateTime startZdt = interview.getInterviewDate().atZone(ZoneId.systemDefault());
            ZonedDateTime endZdt = interview.getInterviewDate().plusHours(1).atZone(ZoneId.systemDefault());

            EventDateTime start = new EventDateTime()
                    .setDateTime(new DateTime(startZdt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)))
                    .setTimeZone(TimeZone.getDefault().getID());

            EventDateTime end = new EventDateTime()
                    .setDateTime(new DateTime(endZdt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)))
                    .setTimeZone(TimeZone.getDefault().getID());

            event.setStart(start);
            event.setEnd(end);

            // Rest of your code remains the same...
            List<EventAttendee> attendees = new ArrayList<>();

            attendees.add(new EventAttendee()
                    .setEmail(interview.getCandidateEmail())
                    .setDisplayName("Candidate"));

            for (InterviewerDto interviewer : interviewers) {
                attendees.add(new EventAttendee()
                        .setEmail(interviewer.getEmail())
                        .setDisplayName(interviewer.getName()));
            }
            event.setAttendees(attendees);

            if (interview.getMode() == InterviewMode.VIRTUAL) {
                event.setConferenceData(new ConferenceData()
                        .setCreateRequest(new CreateConferenceRequest()
                                .setRequestId(String.valueOf(interview.getInterviewId()))
                                .setConferenceSolutionKey(new ConferenceSolutionKey()
                                        .setType("hangoutsMeet"))));
            }

            event = googleCalendar.events()
                    .insert("primary", event)
                    .setConferenceDataVersion(1)
                    .execute();

            if (interview.getMode() == InterviewMode.VIRTUAL) {
                String meetLink = event.getHangoutLink();
                interview.setMeetingLink(meetLink);
                return meetLink;
            }

            return event.getHtmlLink();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create calendar event: " + e.getMessage(), e);
        }
    }
}