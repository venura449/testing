package com.sliit.smartcampus.dto.maintenance;

import com.sliit.smartcampus.entity.MaintenanceTicket;

import java.time.Instant;

public record TicketCommentResponse(
        String id,
        String userId,
        String userEmail,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
    public static TicketCommentResponse from(MaintenanceTicket.EmbeddedTicketComment c) {
        return new TicketCommentResponse(
                c.getId(),
                c.getUserId(),
                c.getUserEmail(),
                c.getContent(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}

// pass 12

// pass 6
