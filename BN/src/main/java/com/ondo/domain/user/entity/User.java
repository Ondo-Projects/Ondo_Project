package com.ondo.domain.user.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

@Entity
@Getter
@NoArgsConstructor


public class User {
    public interface UserRepository extends JpaRepository<User, String> {
        Optional<User> findByUsername(String username);
    }
    @Id
    private String username;
    private String password;
    private String role;

    @Builder
    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }
}