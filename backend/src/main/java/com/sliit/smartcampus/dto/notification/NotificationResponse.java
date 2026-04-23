package com.sliit.smartcampus.dto.notification;

import com.sliit.smartcampus.entity.Notification;
import com.sliit.smartcampus.entity.enums.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        String id,
        NotificationType type,
        String message,
        String relatedEntityType,
        String relatedEntityId,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getMessage(),
                n.getRelatedEntityType(),
                n.getRelatedEntityId(),
                n.isReadFlag(),
                n.getCreatedAt()
        );
    }
}

// cleaned: 2042-04-21T11:30:30

// optimized: 2026-04-23T11:08:04

// updated: 2026-04-23T12:15:37

// validated: 2026-04-23T19:49:50
