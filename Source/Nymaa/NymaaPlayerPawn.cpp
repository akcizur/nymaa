#include "NymaaPlayerPawn.h"

#include "NymaaPlayerController.h"

#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "UObject/ConstructorHelpers.h"
#include "Materials/MaterialInstanceDynamic.h"

ANymaaPlayerPawn::ANymaaPlayerPawn()
{
    PrimaryActorTick.bCanEverTick = true;

    Collision = CreateDefaultSubobject<UCapsuleComponent>(TEXT("Collision"));
    RootComponent = Collision;
    Collision->InitCapsuleSize(42.0f, 90.0f);
    Collision->SetCollisionProfileName(TEXT("Pawn"));

    Body = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Body"));
    Body->SetupAttachment(Collision);
    Body->SetRelativeLocation(FVector(0, 0, 85));
    Body->SetRelativeScale3D(FVector(0.75f, 0.75f, 1.45f));
    Body->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    Head = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Head"));
    Head->SetupAttachment(Collision);
    Head->SetRelativeLocation(FVector(0, 0, 170));
    Head->SetRelativeScale3D(FVector(0.6f));
    Head->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    Nose = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Nose"));
    Nose->SetupAttachment(Head);
    Nose->SetRelativeLocation(FVector(0, 0, 8));
    Nose->SetRelativeScale3D(FVector(0.18f, 0.3f, 0.18f));
    Nose->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (CylinderMesh.Succeeded())
    {
        Body->SetStaticMesh(CylinderMesh.Object);
    }

    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereMesh(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (SphereMesh.Succeeded())
    {
        Head->SetStaticMesh(SphereMesh.Object);
    }

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (CubeMesh.Succeeded())
    {
        Nose->SetStaticMesh(CubeMesh.Object);
    }

    if (UMaterialInterface* BaseMaterial = LoadObject<UMaterialInterface>(
        nullptr,
        TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial")))
    {
        if (UMaterialInstanceDynamic* BodyMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this))
        {
            BodyMaterial->SetVectorParameterValue(TEXT("Color"), FLinearColor(0.18f, 0.48f, 0.78f, 1.0f));
            Body->SetMaterial(0, BodyMaterial);
        }

        if (UMaterialInstanceDynamic* HeadMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this))
        {
            HeadMaterial->SetVectorParameterValue(TEXT("Color"), FLinearColor(0.83f, 0.62f, 0.46f, 1.0f));
            Head->SetMaterial(0, HeadMaterial);
        }

        if (UMaterialInstanceDynamic* NoseMaterial = UMaterialInstanceDynamic::Create(BaseMaterial, this))
        {
            NoseMaterial->SetVectorParameterValue(TEXT("Color"), FLinearColor(0.03f, 0.05f, 0.07f, 1.0f));
            Nose->SetMaterial(0, NoseMaterial);
        }
    }

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(Collision);
    CameraBoom->TargetArmLength = 1800.0f;
    CameraBoom->SetRelativeRotation(FRotator(-55.0f, 0.0f, 0.0f));
    CameraBoom->bDoCollisionTest = false;
    CameraBoom->bInheritPitch = false;
    CameraBoom->bInheritYaw = false;
    CameraBoom->bInheritRoll = false;

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
    Camera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    Camera->FieldOfView = 50.0f;

    AutoPossessPlayer = EAutoReceiveInput::Player0;
}

void ANymaaPlayerPawn::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    ANymaaPlayerController* PC = Cast<ANymaaPlayerController>(GetController());
    if (!PC)
    {
        return;
    }

    FVector2D Input = PC->GetMoveInput();
    FVector2D Flat = Input;

    if (Flat.SizeSquared() > 1.0f)
    {
        Flat.Normalize();
    }

    if (Flat.SizeSquared() > 0.001f)
    {
        const FVector Direction(Flat.X, Flat.Y, 0.0f);

        FVector NewLocation = GetActorLocation() + Direction * 700.0f * DeltaSeconds;
        NewLocation.Z = 100.0f;

        SetActorLocation(NewLocation, true);

        const FRotator TargetRotation(0.0f, FMath::RadiansToDegrees(FMath::Atan2(Direction.Y, Direction.X)), 0.0f);
        SetActorRotation(FMath::RInterpTo(GetActorRotation(), TargetRotation, DeltaSeconds, 14.0f));
    }
}
