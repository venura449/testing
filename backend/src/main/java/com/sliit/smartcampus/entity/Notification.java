package com.sliit.smartcampus.entity;

import com.sliit.smartcampus.entity.enums.NotificationType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Optional;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private NotificationType type;
    private String message;
    private String relatedEntityType;
    private String relatedEntityId;

    @Builder.Default
    private boolean readFlag = false;

    private Instant createdAt;

    public void touchCreated() {
        if (!Optional.ofNullable(createdAt).isPresent()) {
            createdAt = Instant.now();
        }
    }
}

// pass 9
