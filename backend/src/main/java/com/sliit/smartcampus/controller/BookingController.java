package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.booking.BookingRequest;
import com.sliit.smartcampus.dto.booking.BookingResponse;
import com.sliit.smartcampus.dto.booking.BookingStatusUpdateRequest;
import com.sliit.smartcampus.dto.booking.BookingTimeUpdateRequest;
import com.sliit.smartcampus.security.CurrentUserService;
import com.sliit.smartcampus.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<BookingResponse> list(@RequestParam(defaultValue = "false") boolean all) {
        return bookingService.listForCurrentUser(currentUserService.requireCurrentUser(), all);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse get(@PathVariable String id) {
        return bookingService.getById(id, currentUserService.requireCurrentUser());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("isAuthenticated()")
    public BookingResponse create(@RequestBody BookingRequest request) {
        return bookingService.create(request, currentUserService.requireCurrentUser());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public BookingResponse updateStatus(@PathVariable String id, @RequestBody BookingStatusUpdateRequest request) {
        return bookingService.updateStatus(id, request, currentUserService.requireCurrentUser());
    }

    @PutMapping("/{id}/times")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse updateTimes(@PathVariable String id, @RequestBody BookingTimeUpdateRequest request) {
        return bookingService.updateTimes(id, request, currentUserService.requireCurrentUser());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse cancel(@PathVariable String id) {
        return bookingService.cancel(id, currentUserService.requireCurrentUser());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        bookingService.delete(id, currentUserService.requireCurrentUser());
    }

    @PostMapping("/{id}/send-qr")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> sendQrEmail(@PathVariable String id) {
        bookingService.sendQrEmail(id, currentUserService.requireCurrentUser());
        return Map.of("message", "QR code sent to your email");
    }
}
