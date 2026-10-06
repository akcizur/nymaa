#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "NymaaPlayerPawn.generated.h"

class UCapsuleComponent;
class UStaticMeshComponent;
class USpringArmComponent;
class UCameraComponent;

UCLASS()
class NYMAA_API ANymaaPlayerPawn : public APawn
{
    GENERATED_BODY()

public:
    ANymaaPlayerPawn();

    virtual void Tick(float DeltaSeconds) override;

private:
    void SetupVisuals();

    UPROPERTY(VisibleAnywhere)
    UCapsuleComponent* Collision = nullptr;

    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* Body = nullptr;

    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* Head = nullptr;

    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* Nose = nullptr;

    UPROPERTY(VisibleAnywhere)
    USpringArmComponent* CameraBoom = nullptr;

    UPROPERTY(VisibleAnywhere)
    UCameraComponent* Camera = nullptr;
};
