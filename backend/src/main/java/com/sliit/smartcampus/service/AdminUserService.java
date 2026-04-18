package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.admin.UserRoleUpdateRequest;
import com.sliit.smartcampus.dto.user.UserResponse;
import com.sliit.smartcampus.entity.User;
import com.sliit.smartcampus.entity.enums.UserRole;
import com.sliit.smartcampus.exception.ApiException;
import com.sliit.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse updateRole(String userId, UserRoleUpdateRequest req, User admin) {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrator only");
        }
        if (req.role() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "role is required");
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        target.setRole(req.role());
        return UserResponse.from(userRepository.save(target));
    }
}

// optimized: 2037-04-14T15:55:05

// validated: 2026-04-18T18:54:07
