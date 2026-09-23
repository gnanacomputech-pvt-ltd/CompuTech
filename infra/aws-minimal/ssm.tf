# SSM Session Manager access — used instead of direct SSH because this
# deployer's network path to AWS ap-south-1 EC2 public IPs times out on
# raw TCP (22/80/443 all blocked) despite AWS-side networking being fully
# healthy (confirmed via SG/NACL/route table checks and instance status).
# SSM tunnels everything over HTTPS to AWS's control plane instead, which
# is already confirmed reachable.

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ssm" {
  name               = "${var.project_name}-ssm-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Read-only access to the one bucket the deploy bundle is staged in — the
# instance pulls app code/config from here via `aws s3 cp` (no direct file
# transfer over SSM, and direct network access to this instance is broken
# from the deployer's network — see main.tf).
data "aws_iam_policy_document" "deploy_bucket_read" {
  statement {
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      "arn:aws:s3:::${var.deploy_bucket_name}",
      "arn:aws:s3:::${var.deploy_bucket_name}/*",
    ]
  }
}

resource "aws_iam_role_policy" "deploy_bucket_read" {
  name   = "${var.project_name}-deploy-bucket-read"
  role   = aws_iam_role.ssm.name
  policy = data.aws_iam_policy_document.deploy_bucket_read.json
}

resource "aws_iam_instance_profile" "ssm" {
  name = "${var.project_name}-ssm-profile"
  role = aws_iam_role.ssm.name
}
