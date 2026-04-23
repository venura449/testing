package com.sliit.smartcampus.dto.maintenance;

import com.sliit.smartcampus.entity.enums.TicketStatus;

public record TicketResolutionRequest(String resolutionNotes, TicketStatus status) {
}

// pass 19
