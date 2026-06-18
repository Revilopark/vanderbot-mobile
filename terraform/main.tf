terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Variables ─────────────────────────────────────────────────────

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "vanderbot-2"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "vanderbot"
}

variable "iam_mcp_url" {
  description = "IAM MCP SSE endpoint"
  type        = string
  default     = "https://iam-mcp-xxx-uc.a.run.app/sse"
}

# ─── Enable APIs ───────────────────────────────────────────────────

resource "google_project_service" "run" {
  service = "run.googleapis.com"
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
}

resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
}

resource "google_project_service" "sqladmin" {
  service = "sqladmin.googleapis.com"
}

# ─── Cloud SQL (PostgreSQL for Trinity Graph) ──────────────────────

resource "google_sql_database_instance" "trinity" {
  name             = "${var.app_name}-trinity"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    
    ip_configuration {
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "trinity" {
  name     = "trinity_graph"
  instance = google_sql_database_instance.trinity.name
}

resource "google_sql_user" "trinity" {
  name     = "trinity"
  instance = google_sql_database_instance.trinity.name
  password = random_password.trinity.result
}

resource "random_password" "trinity" {
  length  = 16
  special = true
}

# ─── Firestore (Trinity Graph Document Store) ──────────────────────

resource "google_firestore_database" "trinity" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}

# ─── Cloud Run - Vanderbot App ─────────────────────────────────────

resource "google_cloud_run_service" "app" {
  name     = var.app_name
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/${var.app_name}:latest"
        
        ports {
          container_port = 3000
        }
        
        env {
          name  = "IAM_MCP_URL"
          value = var.iam_mcp_url
        }
        
        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.trinity.name}:${random_password.trinity.result}@${google_sql_database_instance.trinity.public_ip_address}/trinity_graph"
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }
      }
      
      service_account_name = google_service_account.vanderbot.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_service_iam_member" "app_public" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Cloud Run - MCP Client ────────────────────────────────────────

resource "google_cloud_run_service" "mcp" {
  name     = "${var.app_name}-mcp"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/${var.app_name}-mcp:latest"
        
        ports {
          container_port = 8080
        }
        
        env {
          name  = "IAM_MCP_URL"
          value = var.iam_mcp_url
        }
        
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }
  }

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_service_iam_member" "mcp_public" {
  service  = google_cloud_run_service.mcp.name
  location = google_cloud_run_service.mcp.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Service Account ───────────────────────────────────────────────

resource "google_service_account" "vanderbot" {
  account_id   = var.app_name
  display_name = "Vanderbot Service Account"
}

resource "google_project_iam_member" "vanderbot_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.vanderbot.email}"
}

resource "google_project_iam_member" "vanderbot_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.vanderbot.email}"
}

# ─── Outputs ───────────────────────────────────────────────────────

output "app_url" {
  value = google_cloud_run_service.app.status[0].url
}

output "mcp_url" {
  value = google_cloud_run_service.mcp.status[0].url
}

output "database_connection" {
  value     = "postgresql://${google_sql_user.trinity.name}:${random_password.trinity.result}@${google_sql_database_instance.trinity.public_ip_address}/trinity_graph"
  sensitive = true
}
