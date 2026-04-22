# Terraform — Valeriy-Dev Contact API on AWS

Deploys the FastAPI contact service as a container-image **Lambda** behind an **HTTP API Gateway** (`$default` route), with a dedicated **ECR** repository and **CloudWatch** logs.

## Cost profile

- Lambda (arm64, 512 MB, 15 s) — essentially free at low volume (free tier covers 1M requests/mo).
- HTTP API Gateway — $1.00 per 1M requests.
- ECR — $0.10 per GB-month of image storage.
- CloudWatch Logs — retention set to 14 days.

## One-time bootstrap

```powershell
# 1. Configure AWS credentials for the target account
aws configure

# 2. Create workspace vars
Copy-Item terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars

# 3. Provision ECR, IAM, Lambda (will fail on first Lambda create — that is expected,
#    because no image has been pushed yet). Create ECR only:
terraform init
terraform apply -target=aws_ecr_repository.api

# 4. Build & push the image (from repo root)
$ACCOUNT = aws sts get-caller-identity --query Account --output text
$REGION  = "eu-central-1"
$REPO    = "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/valeriy-dev-contact-api"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
docker build --platform linux/arm64 -t $REPO:latest ./backend
docker push $REPO:latest

# 5. Apply the rest
terraform apply
```

Terraform will print the invoke URL; wire it into the frontend form `action`.

## Updating the image

```powershell
docker build --platform linux/arm64 -t $REPO:latest ./backend
docker push $REPO:latest
aws lambda update-function-code --function-name valeriy-dev-contact-api --image-uri "$REPO:latest"
```

## Teardown

```powershell
terraform destroy
```

## Notes

- SQLite lives in `/tmp/submissions.db` on Lambda (ephemeral). For durable storage, swap to **DynamoDB** or **RDS** — the `_connect()` abstraction in `backend/main.py` makes this a 30-line change.
- For a custom domain, add `aws_apigatewayv2_domain_name` + ACM certificate and a `CNAME` in DNS.
- Use a remote S3 backend for the state when working in a team.
