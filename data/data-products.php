<?php
    $config = include_once 'config.php';
    $conn = new mysqli($config['host'], $config['name'], $config['pass'], $config['db']);
    if(!$conn) exit;

    $result = $conn->query("SELECT * FROM products");

    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;