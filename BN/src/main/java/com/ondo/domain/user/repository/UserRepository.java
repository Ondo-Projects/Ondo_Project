package com.ondo.domain.user.repository;

import com.ondo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// JpaRepository<User, Long> -> JpaRepository<User, String> 으로 변경!
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);

}
