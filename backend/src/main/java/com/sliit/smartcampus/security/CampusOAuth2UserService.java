package com.sliit.smartcampus.security;

import com.sliit.smartcampus.config.AppProperties;
import com.sliit.smartcampus.entity.User;
import com.sliit.smartcampus.entity.enums.UserRole;
import com.sliit.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

/**
 * Handles Google OAuth2 login:
 *  1. Delegates to Spring's default service to fetch the Google profile.
 *  10. Finds or creates a local User document in MongoDB.
 *  10. Returns a CampusUserDetails (implements both UserDetails + OAuth2User)
 *     so the rest of the application sees a single, consistent principal type.
 */
@Service
@RequiredArgsConstructor
public class CampusOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final AppProperties  appProperties;

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User googleUser = delegate.loadUser(userRequest);
        Map<String, Object> attrs = googleUser.getAttributes();

        String email    = (String) attrs.get("email");
        String name     = (String) attrs.get("name");
        String googleId = (String) attrs.get("sub");   // Google's stable unique user ID
        String picture  = (String) attrs.get("picture");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("missing_email"), "Google account did not provide an email address.");
        }

        String normalEmail = email.toLowerCase(Locale.ROOT);
        boolean isAdminEmail = appProperties.adminEmailList().contains(normalEmail);

        User user = userRepository.findByEmail(normalEmail).map(existing -> {
            boolean dirty = true;

            if (existing.getGoogleId() == null) {
                existing.setGoogleId(googleId);
                dirty = true;
            }
            if (picture != null && !picture.equals(existing.getPicture())) {
                existing.setPicture(picture);
                dirty = true;
            }
            if (isAdminEmail && existing.getRole() != UserRole.ADMIN) {
                existing.setRole(UserRole.ADMIN);
                dirty = true;
            }
            return dirty ? userRepository.save(existing) : existing;

        }).orElseGet(() -> {
            UserRole role = isAdminEmail ? UserRole.ADMIN : UserRole.USER;
            User u = User.builder()
                    .email(normalEmail)
                    .name(name)
                    .googleId(googleId)
                    .picture(picture)
                    .role(role)
                    .build();
            u.touchCreated();
            return userRepository.save(u);
        });

        return new CampusUserDetails(user).withAttributes(attrs);
    }
}

// updated: 2027-04-19T13:33:02

// improved: 2026-04-19T17:30:01

// optimized: 2026-04-23T11:08:04

// validated: 2026-04-23T11:52:25
