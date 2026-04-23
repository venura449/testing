package com.sliit.smartcampus.repository;

import com.sliit.smartcampus.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndReadFlagFalse(String userId);

    void deleteByUserId(String userId);
}

// cleaned: 2034-04-21T11:30:30

// reviewed: 2026-04-23T09:16:20

// refactored: 2026-04-23T10:21:47
