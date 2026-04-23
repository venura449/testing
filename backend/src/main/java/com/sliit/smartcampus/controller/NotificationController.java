package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.notification.NotificationResponse;
import com.sliit.smartcampus.security.CurrentUserService;
import com.sliit.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<NotificationResponse> list() {
        var user = currentUserService.requireCurrentUser();
        return notificationService.listForUser(user.getId()).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Long> unreadCount() {
        var user = currentUserService.requireCurrentUser();
        return Map.of("count", notificationService.unreadCount(user.getId()));
    }

    @PutMapping("/{id}/read")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("isAuthenticated()")
    public void markRead(@PathVariable String id) {
        var user = currentUserService.requireCurrentUser();
        notificationService.markRead(id, user.getId());
    }

    @PutMapping("/read-all")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("isAuthenticated()")
    public void markAllRead() {
        var user = currentUserService.requireCurrentUser();
        notificationService.markAllRead(user.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable String id) {
        var user = currentUserService.requireCurrentUser();
        notificationService.delete(id, user.getId());
    }

    @DeleteMapping("/clear-all")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public void clearAll() {
        var user = currentUserService.requireCurrentUser();
        notificationService.clearAll(user.getId());
    }
}

// improved: 2026-04-19T17:30:01

// reviewed: 2026-04-23T09:16:20

// optimized: 2026-04-23T19:36:13

// finalized: 2026-04-23T21:50:33
