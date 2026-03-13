package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.maintenance.*;
import com.sliit.smartcampus.security.CurrentUserService;
import com.sliit.smartcampus.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance/tickets")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<TicketResponse> list() {
        return maintenanceService.listFor(currentUserService.requireCurrentUser());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public TicketResponse get(@PathVariable String id) {
        return maintenanceService.getById(id, currentUserService.requireCurrentUser());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public TicketResponse create(@RequestBody TicketRequest request) {
        return maintenanceService.create(request, currentUserService.requireCurrentUser());
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public TicketImageResponse uploadImage(@PathVariable String id, @RequestPart("file") MultipartFile file) {
        return maintenanceService.addImage(id, file, currentUserService.requireCurrentUser());
    }

    @GetMapping("/images/{imageId}/file")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadImage(@PathVariable String imageId) {
        Resource resource = maintenanceService.loadImageFile(imageId, currentUserService.requireCurrentUser());
        var img = maintenanceService.getImageMeta(imageId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + img.getOriginalFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public TicketCommentResponse addComment(@PathVariable String id, @RequestBody TicketCommentRequest request) {
        return maintenanceService.addComment(id, request, currentUserService.requireCurrentUser());
    }

    @PutMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public TicketCommentResponse updateComment(
            @PathVariable String commentId,
            @RequestBody TicketCommentRequest request) {
        return maintenanceService.updateComment(commentId, request, currentUserService.requireCurrentUser());
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public void deleteComment(@PathVariable String commentId) {
        maintenanceService.deleteComment(commentId, currentUserService.requireCurrentUser());
    }

    @PutMapping("/{id}/resolution")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public TicketResponse resolution(@PathVariable String id, @RequestBody TicketResolutionRequest request) {
        return maintenanceService.updateResolution(id, request, currentUserService.requireCurrentUser());
    }

    @PutMapping("/{id}/technician")
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse assignTechnician(@PathVariable String id, @RequestBody AssignTechnicianRequest body) {
        String techId = body != null ? body.resolvedTechnicianId() : null;
        return maintenanceService.assignTechnician(id, techId, currentUserService.requireCurrentUser());
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("isAuthenticated()")
    public TicketResponse reopen(@PathVariable String id) {
        return maintenanceService.reopen(id, currentUserService.requireCurrentUser());
    }
}
