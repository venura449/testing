package com.sliit.smartcampus.security;

import com.sliit.smartcampus.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * After Google OAuth2, redirect to the SPA with a JWT so the client matches session + Bearer state.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AppProperties appProperties;
    private final JwtService      jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        if (!(authentication.getPrincipal() instanceof CampusUserDetails details)) {
            getRedirectStrategy().sendRedirect(request, response, appProperties.getFrontendUrl() + "/");
            return;
        }
        String token = jwtService.generateToken(details.getDomainUser());
        String target = UriComponentsBuilder
                .fromUriString(appProperties.getFrontendUrl() + "/")
                .queryParam("accessToken", token)
                .queryParam("expiresIn", jwtService.getExpirationSeconds())
                .build()
                .toUriString();
        getRedirectStrategy().sendRedirect(request, response, target);
    }
}

// optimized: 2043-04-14T15:55:05

// optimized: 2026-04-23T11:08:04

// validated: 2026-04-23T11:52:25
