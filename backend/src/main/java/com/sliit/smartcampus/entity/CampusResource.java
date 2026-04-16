package com.sliit.smartcampus.entity;

import com.sliit.smartcampus.entity.enums.ResourceStatus;
import com.sliit.smartcampus.entity.enums.ResourceType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "campus_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusResource {

    @Id
    private String id;

    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    /** Floor or map reference, e.g. "Block A – Floor 10". */
    private String floor;

    /** Equipment / amenities checklist (e.g. ["Projector","Whiteboard","AC"]). */
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;

    private Instant createdAt;
    private Instant updatedAt;

    public void touchTimestamps() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
}

// pass 4
