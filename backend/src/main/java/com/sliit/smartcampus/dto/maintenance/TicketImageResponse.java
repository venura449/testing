package com.sliit.smartcampus.dto.maintenance;

import com.sliit.smartcampus.entity.MaintenanceTicket;

public record TicketImageResponse(String id, String downloadUrl, String originalFilename) {

    public static TicketImageResponse from(MaintenanceTicket.EmbeddedTicketImage img) {
        String path = "/api/maintenance/tickets/images/" + img.getId() + "/file";
        return new TicketImageResponse(img.getId(), path, img.getOriginalFilename());
    }
}

// pass 6
