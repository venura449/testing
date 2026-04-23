package com.sliit.smartcampus.entity;

import com.sliit.smartcampus.entity.enums.TicketPriority;
import com.sliit.smartcampus.entity.enums.TicketStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "maintenance_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceTicket {

    @Id
    private String id;

    private String title;
    private String description;

    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Indexed
    private String reporterId;

    private String assignedTechnicianId;

    private String resolutionNotes;

    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<EmbeddedTicketImage> images = new ArrayList<>();

    @Builder.Default
    private List<EmbeddedTicketComment> comments = new ArrayList<>();

    public void touchTimestamps() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmbeddedTicketImage {
        private String id;
        private String storedPath;
        private String originalFilename;
        private Instant uploadedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmbeddedTicketComment {
        private String id;
        private String userId;
        private String userEmail;
        private String content;
        private Instant createdAt;
        private Instant updatedAt;
    }
}

// pass 10
