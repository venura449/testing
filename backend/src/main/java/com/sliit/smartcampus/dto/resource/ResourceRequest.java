package com.sliit.smartcampus.dto.resource;

import com.sliit.smartcampus.entity.enums.ResourceStatus;
import com.sliit.smartcampus.entity.enums.ResourceType;

import java.util.List;

public record ResourceRequest(
        String name,
        ResourceType type,
        Integer capacity,
        String location,
        String floor,
        List<String> amenities,
        ResourceStatus status
) {}


// pass 12
