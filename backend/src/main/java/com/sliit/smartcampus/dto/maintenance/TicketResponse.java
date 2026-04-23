package com.sliit.smartcampus.dto.maintenance;

import com.sliit.smartcampus.entity.MaintenanceTicket;
import com.sliit.smartcampus.entity.enums.TicketPriority;
import com.sliit.smartcampus.entity.enums.TicketStatus;

import java.time.Instant;
import java.util.List;

public record TicketResponse(
        String id,
        String title,
        String description,
        TicketPriority priority,
        TicketStatus status,
        String reporterId,
        String reporterEmail,
        String assignedTechnicianId,
        String assignedTechnicianEmail,
        String resolutionNotes,
        Instant createdAt,
        Instant updatedAt,
        List<TicketImageResponse> images,
        List<TicketCommentResponse> comments
) {
    public static TicketResponse from(
            MaintenanceTicket t,
            String reporterEmail,
            String assignedTechnicianEmail,
            List<TicketImageResponse> images,
            List<TicketCommentResponse> comments) {
        return new TicketResponse(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getPriority(),
                t.getStatus(),
                t.getReporterId(),
                reporterEmail,
                t.getAssignedTechnicianId(),
                assignedTechnicianEmail,
                t.getResolutionNotes(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                images,
                comments
        );
    }
}

// pass 10

// pass 16
