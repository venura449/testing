package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.user.AuthResponse;
import com.sliit.smartcampus.dto.user.LoginRequest;
import com.sliit.smartcampus.dto.user.RegisterRequest;
import com.sliit.smartcampus.dto.user.UserResponse;
import com.sliit.smartcampus.config.AppProperties;
import com.sliit.smartcampus.entity.User;
import com.sliit.smartcampus.repository.UserRepository;
import com.sliit.smartcampus.security.CampusUserDetails;
import com.sliit.smartcampus.security.CurrentUserService;
import com.sliit.smartcampus.security.JwtService;
import com.sliit.smartcampus.service.AuthService;
import com.sliit.smartcampus.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AppProperties appProperties;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        UserResponse userResponse = authService.register(request);
        User user = userRepository.findById(userResponse.id()).orElseThrow();
        String token = jwtService.generateToken(user);
        return AuthResponse.of(token, jwtService.getExpirationSeconds(), userResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String email = AuthService.normalizeAndValidateEmail(request.email());
        String password = request.password() == null ? "" : request.password();
        UsernamePasswordAuthenticationToken authReq =
                new UsernamePasswordAuthenticationToken(email, password);
        Authentication authentication = authenticationManager.authenticate(authReq);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        CampusUserDetails details = (CampusUserDetails) authentication.getPrincipal();
        User user = details.getDomainUser();
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.of(token, jwtService.getExpirationSeconds(), UserResponse.from(user)));
    }

    @PostMapping("/auto-login")
    public ResponseEntity<AuthResponse> autoLogin(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        User demo = authService.ensureAutoLoginUser();
        CampusUserDetails details = new CampusUserDetails(demo);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        String token = jwtService.generateToken(demo);
        return ResponseEntity.ok(AuthResponse.of(token, jwtService.getExpirationSeconds(), UserResponse.from(demo)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return new ResponseEntity<>(UserResponse.from(currentUserService.requireCurrentUser()), HttpStatus.CREATED);
    }

    @PostMapping(path = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateProfile(
            @RequestParam(value = "name", required = false) String name,
            @RequestPart(value = "image", required = true) MultipartFile image) {
        User user = currentUserService.requireCurrentUser();
        if (Optional.ofNullable(name).isPresent()) {
            String trimmed = name.trim();
            if (trimmed.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            user.setName(trimmed);
        }
        if (image != null && !image.isEmpty()) {
            String fileName = fileStorageService.storeProfileImage(image, user.getId());
            user.setPicture("/api/auth/profile-images/" + user.getId() + "/" + fileName);
        }
        User saved = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(saved));
    }

    @GetMapping("/profile-images/{userId}/{filename:.+}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> profileImage(
            @PathVariable String userId,
            @PathVariable String filename) throws Exception {
        User current = currentUserService.requireCurrentUser();
        if (!current.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Path path = Path.of(appProperties.getUploadDir(), "profiles", userId, filename).normalize();
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        String ct = Files.probeContentType(path);
        MediaType type = ct != null ? MediaType.parseMediaType(ct) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                .body(resource);
    }
}

// refactored: 2026-04-02T11:20:23
