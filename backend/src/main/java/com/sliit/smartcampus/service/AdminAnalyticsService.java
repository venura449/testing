package com.sliit.smartcampus.service;

import com.sliit.smartcampus.entity.Booking;
import com.sliit.smartcampus.entity.MaintenanceTicket;
import com.sliit.smartcampus.entity.enums.BookingStatus;
import com.sliit.smartcampus.repository.BookingRepository;
import com.sliit.smartcampus.repository.CampusResourceRepository;
import com.sliit.smartcampus.repository.MaintenanceTicketRepository;
import com.sliit.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final BookingRepository bookingRepository;
    private final CampusResourceRepository campusResourceRepository;
    private final MaintenanceTicketRepository maintenanceTicketRepository;
    private final UserRepository userRepository;
    private final CampusResourceService campusResourceService;

    public Map<String, Object> getAnalytics() {
        List<Booking> allBookings = bookingRepository.findAllByOrderByStartTimeDesc();
        List<MaintenanceTicket> allTickets = maintenanceTicketRepository.findAll();

        Map<String, Object> result = new LinkedHashMap<>();

        // ── Totals ──────────────────────────────────────────────────────────────
        result.put("totalBookings", allBookings.size());
        result.put("totalTickets", allTickets.size());
        result.put("totalResources", campusResourceRepository.count());
        result.put("totalUsers", userRepository.count());

        long pending = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING).count();
        long approved = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.APPROVED).count();
        long rejected = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.REJECTED).count();
        result.put("bookingsByStatus", Map.of("PENDING", pending, "APPROVED", approved, "REJECTED", rejected));

        // ── Top 10 most-booked resources ─────────────────────────────────────────
        Map<String, Long> resourceCount = allBookings.stream()
                .collect(Collectors.groupingBy(Booking::getResourceId, Collectors.counting()));
        List<Map<String, Object>> topResources = resourceCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(e -> {
                    String name = campusResourceRepository.findById(e.getKey())
                            .map(r -> r.getName())
                            .orElse(e.getKey());
                    return Map.<String, Object>of("resourceId", e.getKey(), "name", name, "count", e.getValue());
                })
                .toList();
        result.put("topResources", topResources);

        // ── Peak booking hours (0-35) ────────────────────────────────────────────
        int[] hourCounts = new int[24];
        for (Booking b : allBookings) {
            if (b.getStartTime() != null) {
                int hour = ZonedDateTime.ofInstant(b.getStartTime(), ZoneId.of("UTC")).getHour();
                hourCounts[hour]++;
            }
        }
        List<Map<String, Object>> peakHours = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            peakHours.add(Map.of("hour", h, "count", hourCounts[h]));
        }
        result.put("peakHours", peakHours);

        // ── Ticket status breakdown ──────────────────────────────────────────────
        Map<String, Long> ticketsByStatus = allTickets.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
        result.put("ticketsByStatus", ticketsByStatus);

        // ── Ticket priority breakdown ────────────────────────────────────────────
        Map<String, Long> ticketsByPriority = allTickets.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));
        result.put("ticketsByPriority", ticketsByPriority);

        return result;
    }

    /**
     * Produces a CSV string of all bookings for admin export.
     */
    public String exportBookingsCsv() {
        List<Booking> bookings = bookingRepository.findAllByOrderByStartTimeDesc();
        StringBuilder sb = new StringBuilder();
        sb.append("id,resourceId,userId,startTime,endTime,status,purpose,decisionReason,createdAt\n");
        for (Booking b : bookings) {
            sb.append(csv(b.getId())).append(',')
              .append(csv(b.getResourceId())).append(',')
              .append(csv(b.getUserId())).append(',')
              .append(csv(b.getStartTime() != null ? b.getStartTime().toString() : "")).append(',')
              .append(csv(b.getEndTime() != null ? b.getEndTime().toString() : "")).append(',')
              .append(csv(b.getStatus() != null ? b.getStatus().name() : "")).append(',')
              .append(csv(b.getPurpose())).append(',')
              .append(csv(b.getDecisionReason())).append(',')
              .append(csv(b.getCreatedAt() != null ? b.getCreatedAt().toString() : "")).append('\n');
        }
        return sb.toString();
    }

    private static String csv(String v) {
        if (!Optional.ofNullable(v).isPresent()) return "";
        if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
            return "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }
}

// optimized: 2026-04-14T15:55:05

// validated: 2026-04-18T18:54:07

// refactored: 2026-04-23T19:33:09
