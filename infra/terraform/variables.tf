variable "region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Deployment environment tag."
  type        = string
  default     = "prod"
}

variable "image_tag" {
  description = "Container image tag in ECR that Lambda should use."
  type        = string
  default     = "latest"
}

variable "telegram_bot_token" {
  description = "Telegram bot token from @BotFather."
  type        = string
  sensitive   = true
}

variable "telegram_chat_id" {
  description = "Telegram chat id that receives contact-form notifications."
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Comma-separated list of origins allowed to call the API (CORS)."
  type        = string
  default     = "https://valeriy-dev.xyz"
}

variable "rate_limit_per_hour" {
  description = "Per-IP submission rate limit."
  type        = number
  default     = 5
}
