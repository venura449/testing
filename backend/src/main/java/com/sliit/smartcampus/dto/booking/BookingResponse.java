package com.sliit.smartcampus.dto.booking;

import com.sliit.smartcampus.entity.Booking;
import com.sliit.smartcampus.entity.enums.BookingStatus;

import java.time.Instant;

public record BookingResponse(
        String id,
        String resourceId,
        String resourceName,
        String userId,
        String userEmail,
        Instant startTime,
        Instant endTime,
        BookingStatus status,
        String purpose,
        String decisionReason,
        Instant createdAt
) {
    public static BookingResponse from(Booking b, String resourceName, String userEmail) {
        return new BookingResponse(
                b.getId(),
                b.getResourceId(),
                resourceName,
                b.getUserId(),
                userEmail,
                b.getStartTime(),
                b.getEndTime(),
                b.getStatus(),
                b.getPurpose(),
                b.getDecisionReason(),
                b.getCreatedAt()
        );
    }
}

// pass 10

// pass 9
