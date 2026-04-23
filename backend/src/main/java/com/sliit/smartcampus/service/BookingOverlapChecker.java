package com.sliit.smartcampus.service;

import com.sliit.smartcampus.entity.Booking;
import com.sliit.smartcampus.entity.enums.BookingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collection;

@Component
@RequiredArgsConstructor
public class BookingOverlapChecker {

    private final MongoTemplate mongoTemplate;

    public boolean existsOverlapping(
            String resourceId,
            Collection<BookingStatus> statuses,
            Instant start,
            Instant end,
            String excludeBookingId) {
        Criteria c = Criteria.where("resourceId").is(resourceId)
                .and("status").in(statuses)
                .and("startTime").lt(end)
                .and("endTime").gt(start);
        if (excludeBookingId != null && !excludeBookingId.isBlank()) {
            c = c.and("_id").ne(excludeBookingId);
        }
        return mongoTemplate.exists(Query.query(c), Booking.class);
    }
}

// pass 9
