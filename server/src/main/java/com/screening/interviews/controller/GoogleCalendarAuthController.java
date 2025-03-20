//package com.screening.interviews.controller;
//
//import com.google.api.client.auth.oauth2.AuthorizationCodeRequestUrl;
//import com.google.api.client.auth.oauth2.TokenResponse;
//import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequestMapping("/auth")
//@RequiredArgsConstructor
//@Slf4j
//public class GoogleCalendarAuthController {
//
//    private final GoogleAuthorizationCodeFlow flow;
//
//    @Value("${google.calendar.redirect-uri}")
//    private String redirectUri;
//
//    @GetMapping("/google")
//    public String googleAuth() {
//        AuthorizationCodeRequestUrl url = flow.newAuthorizationUrl()
//                .setRedirectUri(redirectUri)
//                .setAccessType("offline");
//        return "redirect:" + url.build();
//    }
//
//    @GetMapping("/google/callback")
//    public String callback(@RequestParam String code) {
//        try {
//            TokenResponse response = flow.newTokenRequest(code)
//                    .setRedirectUri(redirectUri)
//                    .execute();
//
//            flow.createAndStoreCredential(response, "user");
//            return "Successfully authenticated with Google Calendar!";
//        } catch (Exception e) {
//            log.error("Failed to authenticate with Google Calendar", e);
//            return "Failed to authenticate: " + e.getMessage();
//        }
//    }
//}