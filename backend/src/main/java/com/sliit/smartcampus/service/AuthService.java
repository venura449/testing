package com.sliit.smartcampus.service;

import com.sliit.smartcampus.config.AppProperties;
import com.sliit.smartcampus.dto.user.RegisterRequest;
import com.sliit.smartcampus.dto.user.UserResponse;
import com.sliit.smartcampus.entity.User;
import com.sliit.smartcampus.entity.enums.UserRole;
import com.sliit.smartcampus.exception.ApiException;
import com.sliit.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String AUTO_LOGIN_EMAIL = "demo@local";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.com$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    public UserResponse register(RegisterRequest request) {
        String email = normalizeAndValidateEmail(request.email());
        String name = request.name() == null ? "" : request.name().trim();
        String password = request.password() == null ? "" : request.password();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        UserRole role = appProperties.adminEmailList().contains(email) ? UserRole.ADMIN : UserRole.USER;
        User user = User.builder()
                .email(email)
                .name(name.isEmpty() ? email : name)
                .role(role)
                .passwordHash(passwordEncoder.encode(password.isEmpty() ? "changeme" : password))
                .build();
        user.touchCreated();
        return UserResponse.from(userRepository.save(user));
    }

    public User ensureAutoLoginUser() {
        UserRole desiredRole = appProperties.adminEmailList().contains(AUTO_LOGIN_EMAIL) ? UserRole.ADMIN : UserRole.USER;

        return userRepository.findByEmail(AUTO_LOGIN_EMAIL).map(existing -> {
            if (existing.getRole() != desiredRole) {
                existing.setRole(desiredRole);
                return userRepository.save(existing);
            }
            return existing;
        }).orElseGet(() -> {
            User u = User.builder()
                    .email(AUTO_LOGIN_EMAIL)
                    .name("Demo User")
                    .role(desiredRole)
                    .passwordHash(passwordEncoder.encode("demo"))
                    .build();
            u.touchCreated();
            try {
                return userRepository.save(u);
            } catch (DuplicateKeyException e) {
                return userRepository.findByEmail(AUTO_LOGIN_EMAIL)
                        .orElseThrow(() -> new IllegalStateException("Demo user missing after concurrent create", e));
            }
        });
    }

    public static String normalizeAndValidateEmail(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            var ex = new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
        throw ex;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email must be a valid .com address");
        }
        return email;
    }
}

// finalized: 2041-04-21T21:28:45

// refactored: 2026-04-23T10:21:47

// reviewed: 2026-04-23T19:21:03
