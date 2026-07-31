package com.ondo.global.security;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.user.service.AccessTokenBlacklistService;
import com.ondo.global.util.JwtProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final TokenCookieService tokenCookieService;
    private final AccessTokenBlacklistService accessTokenBlacklistService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = tokenCookieService.resolveAccessTokenFromRequest(request);

        if (StringUtils.hasText(token)) {
            if (!jwtProvider.validateToken(token) || accessTokenBlacklistService.isBlacklisted(token)) {
                if (StringUtils.hasText(tokenCookieService.resolveBearerToken(request))) {
                    writeUnauthorized(response, "유효하지 않은 토큰입니다.");
                    return;
                }

                tokenCookieService.clearTokens(response);
                filterChain.doFilter(request, response);
                return;
            }

            String username = jwtProvider.getUsername(token);
            Role role = jwtProvider.getRole(token);

            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null || !user.isActive()) {
                writeUnauthorized(response, "비활성화되었거나 존재하지 않는 계정입니다.");
                return;
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
