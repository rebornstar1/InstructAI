package com.screening.interviews.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
@Slf4j
public class DocumentParserService {

    public String parseDocument(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IllegalArgumentException("File name cannot be null");
        }

        try (InputStream inputStream = file.getInputStream()) {
            if (fileName.toLowerCase().endsWith(".pdf")) {
                return parsePdf(inputStream);
            } else if (fileName.toLowerCase().endsWith(".docx")) {
                return parseDocx(inputStream);
            } else {
                throw new IllegalArgumentException("Unsupported file format. Only PDF and DOCX are supported.");
            }
        }
    }

    private String parsePdf(InputStream inputStream) throws IOException {
        // Alternative way to load PDDocument that may resolve the issue
        PDDocument document = null;
        try {
            document = PDDocument.load(inputStream);
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } finally {
            if (document != null) {
                document.close();
            }
        }
    }

    private String parseDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            XWPFWordExtractor extractor = new XWPFWordExtractor(document);
            return extractor.getText();
        }
    }
}