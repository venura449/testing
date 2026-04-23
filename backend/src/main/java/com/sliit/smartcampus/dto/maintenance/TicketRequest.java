package com.sliit.smartcampus.dto.maintenance;

import com.sliit.smartcampus.entity.enums.TicketPriority;

public record TicketRequest(String title, String description, TicketPriority priority) {
}

// pass 6
