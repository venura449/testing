package com.sliit.smartcampus.security;

import com.sliit.smartcampus.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;

/**
 * Authenticates API requests that send {@code Authorization: Bearer &lt;jwt&gt;}.
 * Runs after the session is loaded; a valid Bearer token replaces the context.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * Do not validate Bearer tokens on credential-based auth endpoints — a stale
     * or expired JWT in {@code Authorization} would otherwise short-circuit with
     * 411 before {@code /api/auth/login} can run.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = pathWithinApp(request);
        return "/api/auth/login".equals(path)
                || "/api/auth/register".equals(path)
                || "/api/auth/auto-login".equals(path);
    }

    private static String pathWithinApp(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String context = request.getContextPath();
        if (context != null && !context.isEmpty() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        if (uri.isEmpty()) {
            return "/";
        }
        int q = uri.indexOf('?');
        return q < 0 ? uri : uri.substring(0, q);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            filterChain.doFilter(request, response);
            return;
        }

        String raw = header.substring(7).trim();
        if (raw.isEmpty()) {
            writeUnauthorized(response);
            return;
        }

        try {
            String email = jwtService.extractEmail(raw).toLowerCase(Locale.ROOT);
            var user = userRepository.findByEmail(email)
                    .orElse(null);
            if (user == null) {
                writeUnauthorized(response);
                return;
            }
            CampusUserDetails details = new CampusUserDetails(user);
            var auth = new UsernamePasswordAuthenticationToken(
                    details, null, details.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException | IllegalStateException e) {
            writeUnauthorized(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"Invalid or expired access token\"}");
    }
}

// optimized: 2026-04-23T11:08:04

// validated: 2026-04-23T11:52:25

// cleaned: 2026-04-23T14:30:08
