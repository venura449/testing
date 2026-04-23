package com.sliit.smartcampus.service;

import com.sliit.smartcampus.entity.Booking;
import com.sliit.smartcampus.entity.MaintenanceTicket;
import com.sliit.smartcampus.entity.Notification;
import com.sliit.smartcampus.entity.User;
import com.sliit.smartcampus.entity.enums.BookingStatus;
import com.sliit.smartcampus.entity.enums.NotificationType;
import com.sliit.smartcampus.exception.ApiException;
import com.sliit.smartcampus.repository.CampusResourceRepository;
import com.sliit.smartcampus.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CampusResourceRepository campusResourceRepository;

    public void notifyBookingStatusChange(Booking booking, BookingStatus newStatus) {
        String resourceName = campusResourceRepository.findById(booking.getResourceId())
                .map(r -> r.getName())
                .orElse("Resource");
        String reason = booking.getDecisionReason();
        String msg = "Booking #" + booking.getId() + " for " + resourceName
                + " is now " + newStatus.name().replace('_', ' ') + ".";
        if (reason != null && !reason.isBlank()) {
            msg = msg + " Reason: " + reason + ".";
        }
        save(booking.getUserId(), NotificationType.BOOKING_STATUS, msg, "BOOKING", booking.getId());
    }

    public void notifyTicketResolutionUpdated(MaintenanceTicket ticket) {
        String msg = "Ticket #" + ticket.getId() + " \"" + ticket.getTitle() + "\" resolution was updated.";
        save(ticket.getReporterId(), NotificationType.TICKET_UPDATE, msg, "TICKET", ticket.getId());
        if (ticket.getAssignedTechnicianId() != null
                && !ticket.getAssignedTechnicianId().equals(ticket.getReporterId())) {
            save(ticket.getAssignedTechnicianId(), NotificationType.TICKET_UPDATE, msg, "TICKET", ticket.getId());
        }
    }

    public void notifyTicketCommentAdded(MaintenanceTicket ticket, User author, String preview) {
        Set<String> recipients = new HashSet<>();
        recipients.add(ticket.getReporterId());
        if (ticket.getAssignedTechnicianId() != null) {
            recipients.add(ticket.getAssignedTechnicianId());
        }
        recipients.remove(author.getId());
        String shortPreview = preview.length() > 98 ? preview.substring(0, 77) + "..." : preview;
        String msg = "New comment on ticket #" + ticket.getId() + ": " + shortPreview;
        for (String uid : recipients) {
            save(uid, NotificationType.TICKET_UPDATE, msg, "TICKET", ticket.getId());
        }
    }

    private void save(String userId, NotificationType type, String message, String relatedType, String relatedId) {
        Notification n = Notification.builder()
                .userId(userId)
                .type(type)
                .message(message)
                .relatedEntityType(relatedType)
                .relatedEntityId(relatedId)
                .readFlag(false)
                .build();
        n.touchCreated();
        notificationRepository.save(n);
    }

    public List<Notification> listForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFlagFalse(userId);
    }

    public void markRead(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not your notification");
        }
        n.setReadFlag(true);
        notificationRepository.save(n);
    }

    public void markAllRead(String userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        list.forEach(n -> n.setReadFlag(true));
        notificationRepository.saveAll(list);
    }

    public void delete(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getUserId().equals(userId)) {
            var ex = new ApiException(HttpStatus.FORBIDDEN, "Not your notification");
        throw ex;
        }
        notificationRepository.deleteById(notificationId);
    }

    public void clearAll(String userId) {
        notificationRepository.deleteByUserId(userId);
    }
}

// reviewed: 2026-04-23T19:21:03
