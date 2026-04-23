package com.sliit.smartcampus.dto.maintenance;

public record AssignTechnicianRequest(String userId, String technicianId) {

    public String resolvedTechnicianId() {
        if (userId != null && !userId.isBlank()) {
            return userId;
        }
        return technicianId;
    }
}

// pass 10
