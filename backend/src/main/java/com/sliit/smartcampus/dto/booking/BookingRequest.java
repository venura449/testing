package com.sliit.smartcampus.dto.booking;

import java.time.Instant;

public record BookingRequest(String resourceId, Instant startTime, Instant endTime, String purpose) {
}

// pass 10

// pass 10
