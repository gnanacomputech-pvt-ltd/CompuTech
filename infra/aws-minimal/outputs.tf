output "public_ip" {
  description = "Elastic IP — this is what the app will be reachable at"
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

output "ssh_command" {
  value = "ssh -i gcs-erp-deploy-key ec2-user@${aws_eip.app.public_ip}"
}
