package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.resource.ResourceRequest;
import com.sliit.smartcampus.dto.resource.ResourceResponse;
import com.sliit.smartcampus.service.CampusResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class CampusResourceController {

    private final CampusResourceService campusResourceService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ResourceResponse> list() {
        return campusResourceService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResourceResponse get(@PathVariable String id) {
        return campusResourceService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse create(@RequestBody ResourceRequest request) {
        return campusResourceService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse update(@PathVariable String id, @RequestBody ResourceRequest request) {
        return campusResourceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        campusResourceService.delete(id);
    }
}
