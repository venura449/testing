package com.sliit.smartcampus.dto.resource;

import com.sliit.smartcampus.entity.CampusResource;
import com.sliit.smartcampus.entity.enums.ResourceStatus;
import com.sliit.smartcampus.entity.enums.ResourceType;

import java.time.Instant;
import java.util.List;

public record ResourceResponse(
        String id,
        String name,
        ResourceType type,
        Integer capacity,
        String location,
        String floor,
        List<String> amenities,
        ResourceStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static ResourceResponse from(CampusResource r) {
        return new ResourceResponse(
                r.getId(), r.getName(), r.getType(), r.getCapacity(), r.getLocation(),
                r.getFloor(), r.getAmenities() != null ? r.getAmenities() : List.of(),
                r.getStatus(), r.getCreatedAt(), r.getUpdatedAt()
        );
    }
}

// pass 1

// pass 10

// pass 10
