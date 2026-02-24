# Infrastructure Requirements

This document details the hardware, operating system, and software prerequisites required to host the Saccoss platform on-premise.

## Minimum Hardware Requirements

For a single-tenant deployment serving up to 500 concurrent users:

* **CPU:** 4 Cores (Modern Intel Xeon or AMD EPYC, or equivalent ARM architecture).
* **RAM:** 8 GB minimum (16 GB recommended to comfortably run MySQL and Next.js concurrently).
* **Storage:**
  * OS & App: 50 GB SSD
  * Database: 100 GB SSD (NVMe preferred for database I/O performance)
  * File Uploads (KYC, Reports): 500 GB - 1 TB SSD/HDD, depending heavily on projected file volume.
* **Network:** 1 Gigabit Ethernet interface. Static IP address assigned on the local intranet.

*(Note: For high availability, application and database components should be split onto two separate physical servers or VMs).*

## Operating System

* **Linux:** Ubuntu 22.04 LTS or 24.04 LTS (Highly Recommended), or Debian 12.
* *(Alternatively, Windows Server can be used via WSL2 or Docker, but native Linux is recommended for production Node.js workloads).*

## Software Prerequisites

The server must have the following software installed before deploying the application:

### 1. Node.js Environment

* **Node.js:** v18.x or v20.x LTS (Match the `engines` field in `package.json`).
* **NPM / Yarn:** Included with Node.js.
* **PM2:** Process manager for Node.js (`npm install -g pm2`).

### 2. Database Server

* **MySQL Server:** v8.0+.
* Ensure MySQL is configured to start on boot and has strong root and application user passwords.

### 3. Web Server / Reverse Proxy

* **NGINX:** Version 1.18 or higher.
* **Certbot (Optional but Recommended):** Let's Encrypt for automatic SSL certificates if the server is accessible via a public domain name. If strictly internal, an internal Corporate Root CA can issue certificates.

### 4. Build Tools & Utilities

* `git` (for code pulling).
* `build-essential` and `python3` (for certain Node-GYP native module compilations like `bcrypt`).
* `ufw` (Uncomplicated Firewall) or `iptables` to secure incoming ports.

## Network & Firewall Configuration

The server's firewall should restrict all incoming traffic except for necessary ports:

| Port | Protocol | Purpose | Access |
| :--- | :--- | :--- | :--- |
| **80** | TCP | HTTP Traffic (Redirects to HTTPS) | Internal Network / Public |
| **443** | TCP | HTTPS Secure Traffic (Application UI) | Internal Network / Public |
| **22** | TCP | SSH Server Management | Restricted IPs / Admins only |
| **3306** | TCP | MySQL Database | `localhost` only (if DB is on same server) |

All outbound traffic on port `443` and `80` should be allowed during the installation phase to download NPM packages, Ubuntu updates, and external API integrations (if applicable).
