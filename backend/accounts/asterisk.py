import paramiko # type: ignore

WSL_IP = "172.28.169.212"      
WSL_USER = "asad"
WSL_PASSWORD = "Asad@313"


def run_command(cmd):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(WSL_IP, username=WSL_USER, password=WSL_PASSWORD)

    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode()
    error = stderr.read().decode()

    ssh.close()
    return output, error


def create_sip_user(extension, secret):
    sip_block = f"""
[{extension}]
type=friend
host=dynamic
secret={secret}
context=internal
disallow=all
allow=ulaw
"""

    cmd = f'echo "{sip_block}" | sudo tee -a /etc/asterisk/sip.conf'
    run_command(cmd)

    # Reload Asterisk
    run_command("sudo asterisk -rx 'sip reload'")
