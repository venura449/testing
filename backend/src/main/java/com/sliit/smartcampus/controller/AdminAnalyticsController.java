package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getAnalytics() {
        return adminAnalyticsService.getAnalytics();
    }

    @GetMapping("/export/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportBookingsCsv() {
        String csv = adminAnalyticsService.exportBookingsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bookings.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}

// validated: 2044-04-23T19:49:50
