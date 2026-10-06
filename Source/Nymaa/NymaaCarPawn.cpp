#include "NymaaCarPawn.h"

#include "NymaaPlayerController.h"

#include "Camera/CameraComponent.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "UObject/ConstructorHelpers.h"

ANymaaCarPawn::ANymaaCarPawn()
{
    PrimaryActorTick.bCanEverTick = true;

    Collision = CreateDefaultSubobject<UBoxComponent>(TEXT("Collision"));
    RootComponent = Collision;
    Collision->SetBoxExtent(FVector(100, 60, 220));
    Collision->SetCollisionProfileName(TEXT("Pawn"));

    Body = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Body"));
    Body->SetupAttachment(Collision);
    Body->SetRelativeLocation(FVector(0, 0, 72));
    Body->SetRelativeScale3D(FVector(1.0f, 1.0f, 0.35f));
    Body->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    Cabin = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Cabin"));
    Cabin->SetupAttachment(Collision);
    Cabin->SetRelativeLocation(FVector(-20, 0, 140));
    Cabin->SetRelativeScale3D(FVector(0.85f, 0.85f, 0.55f));
    Cabin->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    WheelsRoot = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("WheelsRoot"));
    WheelsRoot->SetupAttachment(Collision);
    WheelsRoot->SetStaticMesh(nullptr);
    WheelsRoot->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (CubeMesh.Succeeded())
    {
        Body->SetStaticMesh(CubeMesh.Object);
        Cabin->SetStaticMesh(CubeMesh.Object);
    }

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));

    if (CylinderMesh.Succeeded())
    {
        const FVector WheelScale(0.42f, 0.16f, 0.42f);
        const FName Names[] = { TEXT("WheelFL"), TEXT("WheelFR"), TEXT("WheelRL"), TEXT("WheelRR") };
        const FVector Positions[] =
        {
            FVector(145, -110, 48),
            FVector(145, 110, 48),
            FVector(-145, -110, 48),
            FVector(-145, 110, 48)
        };

        for (int32 i = 0; i < 4; ++i)
        {
            UStaticMeshComponent* Wheel = NewObject<UStaticMeshComponent>(this, Names[i]);
            Wheel->SetupAttachment(Collision);
            Wheel->RegisterComponent();
            Wheel->SetStaticMesh(CylinderMesh.Object);
            Wheel->SetRelativeLocation(Positions[i]);
            Wheel->SetRelativeRotation(FRotator(90, 0, 0));
            Wheel->SetRelativeScale3D(WheelScale);
            Wheel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        }
    }

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(Collision);
    CameraBoom->TargetArmLength = 2200.0f;
    CameraBoom->SetRelativeRotation(FRotator(-55.0f, 0.0f, 0.0f));
    CameraBoom->bDoCollisionTest = false;
    CameraBoom->bInheritPitch = false;
    CameraBoom->bInheritYaw = false;
    CameraBoom->bInheritRoll = false;

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
    Camera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    Camera->FieldOfView = 50.0f;
}

void ANymaaCarPawn::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    ANymaaPlayerController* PC = Cast<ANymaaPlayerController>(GetController());
    if (!PC)
    {
        return;
    }

    const FVector2D Input = PC->GetMoveInput();
    const float Throttle = -Input.X;
    const float Steer = Input.Y;

    if (Throttle > 0.04f)
    {
        Speed += 1600.0f * Throttle * DeltaSeconds;
    }
    else if (Throttle < -0.04f)
    {
        if (Speed > 20.0f)
        {
            Speed -= 3200.0f * FMath::Abs(Throttle) * DeltaSeconds;
        }
        else
        {
            Speed -= 960.0f * FMath::Abs(Throttle) * DeltaSeconds;
        }
    }
    else
    {
        Speed = FMath::FInterpTo(Speed, 0.0f, DeltaSeconds, 2.4f);
    }

    Speed = FMath::Clamp(Speed, -900.0f, 2400.0f);

    if (FMath::Abs(Steer) > 0.04f && FMath::Abs(Speed) > 30.0f)
    {
        const float Grip = FMath::Min(1.0f, FMath::Abs(Speed) / 600.0f);
        AddActorLocalRotation(FRotator(0.0f, Steer * 2.2f * 60.0f * Grip * FMath::Sign(Speed) * DeltaSeconds, 0.0f));
    }

    FVector NewLocation = GetActorLocation() + GetActorForwardVector() * Speed * DeltaSeconds;
    NewLocation.Z = 100.0f;

    SetActorLocation(NewLocation, true);
}
