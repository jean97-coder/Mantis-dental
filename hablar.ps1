param([string]$texto = "Hola")

$body = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        contacts = @(
                            @{
                                profile = @{ name = "María Gómez" } # <--- Nombre del nuevo paciente
                                wa_id = "593888888888"            # <--- Número de teléfono único del nuevo paciente
                            }
                        )
                        messages = @(
                            @{
                                from = "593888888888"             # <--- Debe coincidir con el wa_id de arriba
                                id = "wamid." + (Get-Random)
                                timestamp = "1710000000"
                                text = @{ body = $texto }
                                type = "text"
                            }
                        )
                    }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4001/api/whatsapp/webhook" -Method Post -ContentType "application/json" -Body $body