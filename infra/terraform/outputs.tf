output "api_url" {
  description = "Invoke URL for the contact API."
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "ecr_repository_url" {
  description = "Push the Docker image to this ECR repository."
  value       = aws_ecr_repository.api.repository_url
}

output "lambda_function_name" {
  description = "Lambda function name."
  value       = aws_lambda_function.api.function_name
}

output "log_group" {
  description = "CloudWatch log group for the Lambda."
  value       = aws_cloudwatch_log_group.api.name
}
