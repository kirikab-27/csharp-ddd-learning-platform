import type { Lesson } from '../../../../features/learning/types';

export const practicalProjectLesson: Lesson = {
  id: 'practical-project',
  moduleId: 'ddd-implementation',
  title: '実践プロジェクト - DDDを使った図書館管理システムの構築',
  description: 'これまで学んだDDDの全概念を統合し、実際の図書館管理システムを完全に設計・実装する総合実践プロジェクトです',
  duration: 180,
  order: 11,
  content: `
# DDDによる図書館管理システム実践プロジェクト

これまで学んだドメイン駆動設計のすべての概念を統合し、実際の図書館管理システムを完全に設計・実装します。このプロジェクトを通じて、DDDの理論を実践的なスキルとして身につけることができます。

## プロジェクト概要

### 要件定義

**図書館管理システム**の主要機能：

1. **図書管理**: 図書の登録、検索、在庫管理
2. **利用者管理**: 利用者の登録、利用履歴管理
3. **貸出管理**: 図書の貸出・返却・予約処理
4. **延滞管理**: 延滞通知、延滞料金計算
5. **レポート**: 利用統計、人気図書ランキング

### ドメインエキスパートとの会話

**図書館司書との対話例**：

> **司書**: 「図書の貸出期間は通常2週間ですが、研究者は4週間まで延長可能です」
> 
> **開発者**: 「利用者の種類によって貸出ルールが異なるということですね」
> 
> **司書**: 「はい。また、人気の図書は予約待ちになることが多く、予約順序を管理する必要があります」
> 
> **開発者**: 「予約システムでは先着順が基本ルールですか？」
> 
> **司書**: 「基本的には先着順ですが、緊急性の高い研究利用などは優先度を上げることもあります」

この会話から、以下のドメイン概念が見えてきます：
- 利用者タイプ（一般、研究者）
- 貸出ルール（期間、延長可否）
- 予約システム（先着順、優先度）

## ドメインモデリング

### イベントストーミング

システムで発生する主要なドメインイベントを特定：

\`\`\`
時系列でのイベント発生順序：

1. 利用者登録 → MemberRegistered
2. 図書登録 → BookRegistered
3. 図書検索 → BookSearched
4. 貸出申込 → LoanRequested
5. 図書貸出 → BookLoaned
6. 返却期限到来 → DueDateApproaching
7. 図書返却 → BookReturned
8. 延滞発生 → BookOverdue
9. 延滞料支払 → OverdueFeesPaid
10. 予約申込 → BookReserved
11. 予約確定 → ReservationConfirmed
\`\`\`

### 境界づけられたコンテキスト

**コンテキストマップ**：

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Member Context │    │ Catalog Context │    │  Loan Context   │
│                 │    │                 │    │                 │
│ • Member        │    │ • Book          │    │ • Loan          │
│ • MemberType    │    │ • Category      │    │ • Reservation   │
│ • ContactInfo   │    │ • Author        │    │ • LoanRule      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │        Finance Context            │
                │                                   │
                │ • OverdueFee                     │
                │ • Payment                        │
                │ • FinancialTransaction           │
                └───────────────────────────────────┘
\`\`\`

## ドメイン層の実装

### エンティティとアグリゲート

#### 図書アグリゲート

\`\`\`csharp
// Domain/Aggregates/BookCatalog/Book.cs
public class Book : AggregateRoot<BookId>
{
    public Title Title { get; private set; }
    public Author Author { get; private set; }
    public ISBN ISBN { get; private set; }
    public PublicationDate PublicationDate { get; private set; }
    public Category Category { get; private set; }
    public BookStatus Status { get; private set; }
    public Location Location { get; private set; }

    private readonly List<BookCopy> _copies = new();
    public IReadOnlyList<BookCopy> Copies => _copies.AsReadOnly();

    public Book(BookId id, Title title, Author author, ISBN isbn, 
               PublicationDate publicationDate, Category category)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Author = author ?? throw new ArgumentNullException(nameof(author));
        ISBN = isbn ?? throw new ArgumentNullException(nameof(isbn));
        PublicationDate = publicationDate ?? throw new ArgumentNullException(nameof(publicationDate));
        Category = category ?? throw new ArgumentNullException(nameof(category));
        Status = BookStatus.Available;

        AddDomainEvent(new BookRegistered(Id, Title, Author, ISBN));
    }

    public BookCopy AddCopy(Location location)
    {
        var copyNumber = _copies.Count + 1;
        var copy = new BookCopy(BookCopyId.New(), Id, copyNumber, location);
        _copies.Add(copy);

        AddDomainEvent(new BookCopyAdded(Id, copy.Id, copyNumber));
        return copy;
    }

    public bool HasAvailableCopy()
    {
        return _copies.Any(c => c.Status == BookCopyStatus.Available);
    }

    public BookCopy GetAvailableCopy()
    {
        var availableCopy = _copies.FirstOrDefault(c => c.Status == BookCopyStatus.Available);
        if (availableCopy == null)
            throw new NoAvailableCopyException(Id);

        return availableCopy;
    }

    public void UpdateCategory(Category newCategory)
    {
        if (newCategory == null)
            throw new ArgumentNullException(nameof(newCategory));

        var oldCategory = Category;
        Category = newCategory;

        AddDomainEvent(new BookCategoryChanged(Id, oldCategory, newCategory));
    }
}

// Domain/Aggregates/BookCatalog/BookCopy.cs
public class BookCopy : Entity<BookCopyId>
{
    public BookId BookId { get; private set; }
    public int CopyNumber { get; private set; }
    public Location Location { get; private set; }
    public BookCopyStatus Status { get; private set; }
    public DateTime? LastLoanedDate { get; private set; }

    public BookCopy(BookCopyId id, BookId bookId, int copyNumber, Location location)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        BookId = bookId ?? throw new ArgumentNullException(nameof(bookId));
        CopyNumber = copyNumber;
        Location = location ?? throw new ArgumentNullException(nameof(location));
        Status = BookCopyStatus.Available;
    }

    public void MarkAsLoaned()
    {
        if (Status != BookCopyStatus.Available)
            throw new InvalidOperationException($"Cannot loan copy in status {Status}");

        Status = BookCopyStatus.Loaned;
        LastLoanedDate = DateTime.UtcNow;
    }

    public void MarkAsReturned()
    {
        if (Status != BookCopyStatus.Loaned)
            throw new InvalidOperationException($"Cannot return copy in status {Status}");

        Status = BookCopyStatus.Available;
    }

    public void MarkAsLost()
    {
        Status = BookCopyStatus.Lost;
    }
}
\`\`\`

#### 貸出アグリゲート

\`\`\`csharp
// Domain/Aggregates/Lending/Loan.cs
public class Loan : AggregateRoot<LoanId>
{
    public MemberId MemberId { get; private set; }
    public BookCopyId BookCopyId { get; private set; }
    public DateTime LoanDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public DateTime? ReturnDate { get; private set; }
    public LoanStatus Status { get; private set; }
    public Money? OverdueFee { get; private set; }

    private readonly List<LoanExtension> _extensions = new();
    public IReadOnlyList<LoanExtension> Extensions => _extensions.AsReadOnly();

    public Loan(LoanId id, MemberId memberId, BookCopyId bookCopyId, 
               DateTime loanDate, LoanRule loanRule)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        MemberId = memberId ?? throw new ArgumentNullException(nameof(memberId));
        BookCopyId = bookCopyId ?? throw new ArgumentNullException(nameof(bookCopyId));
        LoanDate = loanDate;
        DueDate = loanRule.CalculateDueDate(loanDate);
        Status = LoanStatus.Active;

        AddDomainEvent(new BookLoaned(Id, MemberId, BookCopyId, LoanDate, DueDate));
    }

    public void ExtendLoan(LoanRule loanRule, DateTime extensionDate)
    {
        if (Status != LoanStatus.Active)
            throw new InvalidOperationException("Can only extend active loans");

        if (!loanRule.CanExtend(this, extensionDate))
            throw new LoanExtensionNotAllowedException(Id);

        var maxExtensions = loanRule.MaxExtensions;
        if (_extensions.Count >= maxExtensions)
            throw new MaximumExtensionsReachedException(Id, maxExtensions);

        var extension = new LoanExtension(
            LoanExtensionId.New(),
            extensionDate,
            DueDate,
            loanRule.CalculateExtendedDueDate(DueDate)
        );

        _extensions.Add(extension);
        DueDate = extension.NewDueDate;

        AddDomainEvent(new LoanExtended(Id, MemberId, extension.OriginalDueDate, extension.NewDueDate));
    }

    public void Return(DateTime returnDate, IOverdueFeeCalculator feeCalculator)
    {
        if (Status != LoanStatus.Active)
            throw new InvalidOperationException("Can only return active loans");

        ReturnDate = returnDate;
        Status = LoanStatus.Returned;

        if (returnDate > DueDate)
        {
            var daysOverdue = (returnDate - DueDate).Days;
            OverdueFee = feeCalculator.CalculateFee(daysOverdue);
            
            AddDomainEvent(new BookReturnedOverdue(Id, MemberId, BookCopyId, 
                                                 returnDate, daysOverdue, OverdueFee));
        }
        else
        {
            AddDomainEvent(new BookReturned(Id, MemberId, BookCopyId, returnDate));
        }
    }

    public bool IsOverdue(DateTime currentDate)
    {
        return Status == LoanStatus.Active && currentDate > DueDate;
    }

    public int DaysOverdue(DateTime currentDate)
    {
        if (!IsOverdue(currentDate))
            return 0;

        return (currentDate - DueDate).Days;
    }
}

// Domain/Aggregates/Lending/LoanRule.cs
public class LoanRule : ValueObject
{
    public MemberType MemberType { get; }
    public TimeSpan LoanPeriod { get; }
    public int MaxExtensions { get; }
    public TimeSpan ExtensionPeriod { get; }

    public LoanRule(MemberType memberType, TimeSpan loanPeriod, 
                   int maxExtensions, TimeSpan extensionPeriod)
    {
        MemberType = memberType;
        LoanPeriod = loanPeriod;
        MaxExtensions = maxExtensions;
        ExtensionPeriod = extensionPeriod;
    }

    public DateTime CalculateDueDate(DateTime loanDate)
    {
        return loanDate.Add(LoanPeriod);
    }

    public DateTime CalculateExtendedDueDate(DateTime currentDueDate)
    {
        return currentDueDate.Add(ExtensionPeriod);
    }

    public bool CanExtend(Loan loan, DateTime extensionDate)
    {
        // 返却期限前でないと延長できない
        if (extensionDate > loan.DueDate)
            return false;

        // 最大延長回数に達していないこと
        return loan.Extensions.Count < MaxExtensions;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return MemberType;
        yield return LoanPeriod;
        yield return MaxExtensions;
        yield return ExtensionPeriod;
    }

    // 標準的な貸出ルール
    public static LoanRule StandardMember => new(
        MemberType.Standard, 
        TimeSpan.FromDays(14), 
        1, 
        TimeSpan.FromDays(7)
    );

    public static LoanRule ResearcherMember => new(
        MemberType.Researcher, 
        TimeSpan.FromDays(28), 
        2, 
        TimeSpan.FromDays(14)
    );
}
\`\`\`

### ドメインサービス

#### 予約管理サービス

\`\`\`csharp
// Domain/Services/ReservationService.cs
public class ReservationService : IReservationService
{
    private readonly IBookRepository _bookRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly ILoanRepository _loanRepository;

    public ReservationService(IBookRepository bookRepository,
                            IReservationRepository reservationRepository,
                            ILoanRepository loanRepository)
    {
        _bookRepository = bookRepository ?? throw new ArgumentNullException(nameof(bookRepository));
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _loanRepository = loanRepository ?? throw new ArgumentNullException(nameof(loanRepository));
    }

    public async Task<Reservation> ReserveBookAsync(BookId bookId, MemberId memberId, 
                                                   DateTime reservationDate, CancellationToken cancellationToken = default)
    {
        var book = await _bookRepository.GetByIdAsync(bookId, cancellationToken);
        if (book == null)
            throw new BookNotFoundException(bookId);

        // すでに同じ本を借りているかチェック
        var existingLoan = await _loanRepository.GetActiveLoanByMemberAndBookAsync(memberId, bookId, cancellationToken);
        if (existingLoan != null)
            throw new BookAlreadyLoanedException(memberId, bookId);

        // すでに予約しているかチェック
        var existingReservation = await _reservationRepository.GetActiveReservationByMemberAndBookAsync(
            memberId, bookId, cancellationToken);
        if (existingReservation != null)
            throw new BookAlreadyReservedException(memberId, bookId);

        // 予約待ち順序を決定
        var activeReservations = await _reservationRepository.GetActiveReservationsByBookAsync(bookId, cancellationToken);
        var queuePosition = activeReservations.Count() + 1;

        var reservation = new Reservation(
            ReservationId.New(),
            bookId,
            memberId,
            reservationDate,
            queuePosition
        );

        return reservation;
    }

    public async Task ProcessReturnForReservationsAsync(BookId bookId, CancellationToken cancellationToken = default)
    {
        var nextReservation = await _reservationRepository.GetNextReservationAsync(bookId, cancellationToken);
        if (nextReservation == null)
            return;

        nextReservation.Confirm(DateTime.UtcNow.AddDays(3)); // 3日間の確保期間

        // 他の予約の順位を更新
        var otherReservations = await _reservationRepository.GetActiveReservationsByBookAsync(bookId, cancellationToken);
        foreach (var other in otherReservations.Where(r => r.Id != nextReservation.Id))
        {
            other.MoveUpInQueue();
        }
    }
}

// Domain/Aggregates/Reservation/Reservation.cs
public class Reservation : AggregateRoot<ReservationId>
{
    public BookId BookId { get; private set; }
    public MemberId MemberId { get; private set; }
    public DateTime ReservationDate { get; private set; }
    public int QueuePosition { get; private set; }
    public ReservationStatus Status { get; private set; }
    public DateTime? ConfirmationDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }

    public Reservation(ReservationId id, BookId bookId, MemberId memberId, 
                      DateTime reservationDate, int queuePosition)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        BookId = bookId ?? throw new ArgumentNullException(nameof(bookId));
        MemberId = memberId ?? throw new ArgumentNullException(nameof(memberId));
        ReservationDate = reservationDate;
        QueuePosition = queuePosition;
        Status = ReservationStatus.Waiting;

        AddDomainEvent(new BookReserved(Id, BookId, MemberId, queuePosition, reservationDate));
    }

    public void Confirm(DateTime expiryDate)
    {
        if (Status != ReservationStatus.Waiting)
            throw new InvalidOperationException("Can only confirm waiting reservations");

        Status = ReservationStatus.Confirmed;
        ConfirmationDate = DateTime.UtcNow;
        ExpiryDate = expiryDate;

        AddDomainEvent(new ReservationConfirmed(Id, BookId, MemberId, ConfirmationDate.Value, ExpiryDate.Value));
    }

    public void Cancel()
    {
        if (Status == ReservationStatus.Cancelled || Status == ReservationStatus.Fulfilled)
            throw new InvalidOperationException($"Cannot cancel reservation in status {Status}");

        Status = ReservationStatus.Cancelled;
        AddDomainEvent(new ReservationCancelled(Id, BookId, MemberId, DateTime.UtcNow));
    }

    public void Fulfill()
    {
        if (Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Can only fulfill confirmed reservations");

        Status = ReservationStatus.Fulfilled;
        AddDomainEvent(new ReservationFulfilled(Id, BookId, MemberId, DateTime.UtcNow));
    }

    public void MoveUpInQueue()
    {
        if (QueuePosition > 1)
        {
            QueuePosition--;
        }
    }

    public bool IsExpired(DateTime currentDate)
    {
        return Status == ReservationStatus.Confirmed && 
               ExpiryDate.HasValue && 
               currentDate > ExpiryDate.Value;
    }
}
\`\`\`

## アプリケーション層の実装

### アプリケーションサービス

\`\`\`csharp
// Application/Services/LibraryApplicationService.cs
public class LibraryApplicationService : ILibraryApplicationService
{
    private readonly IBookRepository _bookRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly ILoanRepository _loanRepository;
    private readonly IReservationService _reservationService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;
    private readonly ILogger<LibraryApplicationService> _logger;

    public LibraryApplicationService(
        IBookRepository bookRepository,
        IMemberRepository memberRepository,
        ILoanRepository loanRepository,
        IReservationService reservationService,
        IUnitOfWork unitOfWork,
        IMediator mediator,
        ILogger<LibraryApplicationService> logger)
    {
        _bookRepository = bookRepository ?? throw new ArgumentNullException(nameof(bookRepository));
        _memberRepository = memberRepository ?? throw new ArgumentNullException(nameof(memberRepository));
        _loanRepository = loanRepository ?? throw new ArgumentNullException(nameof(loanRepository));
        _reservationService = reservationService ?? throw new ArgumentNullException(nameof(reservationService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<LoanDto> LoanBookAsync(LoanBookCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing loan request for member {MemberId} and book {BookId}", 
                              command.MemberId, command.BookId);

        // エンティティの取得
        var member = await _memberRepository.GetByIdAsync(new MemberId(command.MemberId), cancellationToken);
        if (member == null)
            throw new MemberNotFoundException(command.MemberId);

        var book = await _bookRepository.GetByIdAsync(new BookId(command.BookId), cancellationToken);
        if (book == null)
            throw new BookNotFoundException(new BookId(command.BookId));

        // ビジネスルールの検証
        var activeLoanCount = await _loanRepository.GetActiveLoanCountByMemberAsync(member.Id, cancellationToken);
        if (!member.CanBorrowMore(activeLoanCount))
            throw new LoanLimitExceededException(member.Id, member.LoanLimit);

        if (!book.HasAvailableCopy())
            throw new NoAvailableCopyException(book.Id);

        // 貸出処理
        var availableCopy = book.GetAvailableCopy();
        var loanRule = LoanRule.GetByMemberType(member.MemberType);
        var loan = new Loan(
            LoanId.New(), 
            member.Id, 
            availableCopy.Id, 
            DateTime.UtcNow, 
            loanRule
        );

        availableCopy.MarkAsLoaned();

        // 永続化
        await _loanRepository.AddAsync(loan, cancellationToken);
        await _bookRepository.UpdateAsync(book, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // ドメインイベントの発行
        await PublishDomainEventsAsync(loan, cancellationToken);

        _logger.LogInformation("Loan {LoanId} created successfully", loan.Id);

        return MapToDto(loan, book, member);
    }

    public async Task ReturnBookAsync(ReturnBookCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing return for loan {LoanId}", command.LoanId);

        var loan = await _loanRepository.GetByIdAsync(new LoanId(command.LoanId), cancellationToken);
        if (loan == null)
            throw new LoanNotFoundException(new LoanId(command.LoanId));

        var book = await _bookRepository.GetBookByBookCopyIdAsync(loan.BookCopyId, cancellationToken);
        if (book == null)
            throw new BookNotFoundException(loan.BookCopyId);

        var copy = book.Copies.First(c => c.Id == loan.BookCopyId);

        // 返却処理
        var feeCalculator = new OverdueFeeCalculator();
        loan.Return(DateTime.UtcNow, feeCalculator);
        copy.MarkAsReturned();

        // 予約処理
        await _reservationService.ProcessReturnForReservationsAsync(book.Id, cancellationToken);

        // 永続化
        await _loanRepository.UpdateAsync(loan, cancellationToken);
        await _bookRepository.UpdateAsync(book, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // ドメインイベントの発行
        await PublishDomainEventsAsync(loan, cancellationToken);

        _logger.LogInformation("Book returned successfully for loan {LoanId}", loan.Id);
    }

    public async Task<ReservationDto> ReserveBookAsync(ReserveBookCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing reservation for member {MemberId} and book {BookId}", 
                              command.MemberId, command.BookId);

        var reservation = await _reservationService.ReserveBookAsync(
            new BookId(command.BookId), 
            new MemberId(command.MemberId), 
            DateTime.UtcNow, 
            cancellationToken
        );

        await _reservationRepository.AddAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await PublishDomainEventsAsync(reservation, cancellationToken);

        _logger.LogInformation("Reservation {ReservationId} created successfully", reservation.Id);

        return MapToDto(reservation);
    }

    private async Task PublishDomainEventsAsync(IAggregateRoot aggregateRoot, CancellationToken cancellationToken)
    {
        var domainEvents = aggregateRoot.DomainEvents.ToList();
        aggregateRoot.ClearDomainEvents();

        foreach (var domainEvent in domainEvents)
        {
            await _mediator.Publish(domainEvent, cancellationToken);
        }
    }

    private static LoanDto MapToDto(Loan loan, Book book, Member member)
    {
        return new LoanDto
        {
            Id = loan.Id.Value,
            MemberId = loan.MemberId.Value,
            MemberName = member.Name,
            BookId = book.Id.Value,
            BookTitle = book.Title.Value,
            LoanDate = loan.LoanDate,
            DueDate = loan.DueDate,
            Status = loan.Status.ToString(),
            OverdueFee = loan.OverdueFee?.Amount
        };
    }
}
\`\`\`

### コマンドとクエリ

\`\`\`csharp
// Application/Commands/LoanBookCommand.cs
public record LoanBookCommand(
    Guid MemberId,
    Guid BookId,
    DateTime LoanDate
) : IRequest<LoanDto>;

public class LoanBookCommandValidator : AbstractValidator<LoanBookCommand>
{
    public LoanBookCommandValidator()
    {
        RuleFor(x => x.MemberId)
            .NotEmpty()
            .WithMessage("Member ID is required");

        RuleFor(x => x.BookId)
            .NotEmpty()
            .WithMessage("Book ID is required");

        RuleFor(x => x.LoanDate)
            .NotEmpty()
            .LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("Loan date cannot be in the future");
    }
}

// Application/Queries/GetMemberLoansQuery.cs
public record GetMemberLoansQuery(
    Guid MemberId,
    bool IncludeReturned = false
) : IRequest<IEnumerable<LoanDto>>;

public class GetMemberLoansQueryHandler : IRequestHandler<GetMemberLoansQuery, IEnumerable<LoanDto>>
{
    private readonly ILoanReadModelRepository _loanReadModelRepository;

    public GetMemberLoansQueryHandler(ILoanReadModelRepository loanReadModelRepository)
    {
        _loanReadModelRepository = loanReadModelRepository ?? throw new ArgumentNullException(nameof(loanReadModelRepository));
    }

    public async Task<IEnumerable<LoanDto>> Handle(GetMemberLoansQuery request, CancellationToken cancellationToken)
    {
        return await _loanReadModelRepository.GetByMemberIdAsync(
            request.MemberId, 
            request.IncludeReturned, 
            cancellationToken
        );
    }
}
\`\`\`

## テスト戦略

### 単体テスト例

\`\`\`csharp
// Tests/Domain/LoanTests.cs
public class LoanTests
{
    [Fact]
    public void Constructor_WithValidParameters_ShouldCreateActiveLoan()
    {
        // Arrange
        var loanId = LoanId.New();
        var memberId = MemberId.New();
        var bookCopyId = BookCopyId.New();
        var loanDate = DateTime.UtcNow;
        var loanRule = LoanRule.StandardMember;

        // Act
        var loan = new Loan(loanId, memberId, bookCopyId, loanDate, loanRule);

        // Assert
        loan.Id.Should().Be(loanId);
        loan.MemberId.Should().Be(memberId);
        loan.BookCopyId.Should().Be(bookCopyId);
        loan.LoanDate.Should().Be(loanDate);
        loan.DueDate.Should().Be(loanDate.AddDays(14)); // Standard loan period
        loan.Status.Should().Be(LoanStatus.Active);
        loan.ReturnDate.Should().BeNull();
    }

    [Fact]
    public void ExtendLoan_WithValidConditions_ShouldExtendDueDateAndRaiseEvent()
    {
        // Arrange
        var loan = CreateValidLoan();
        var loanRule = LoanRule.StandardMember;
        var extensionDate = loan.LoanDate.AddDays(10);
        var originalDueDate = loan.DueDate;

        // Act
        loan.ExtendLoan(loanRule, extensionDate);

        // Assert
        loan.DueDate.Should().Be(originalDueDate.AddDays(7)); // Extension period
        loan.Extensions.Should().HaveCount(1);
        
        var domainEvent = loan.DomainEvents.OfType<LoanExtended>().Single();
        domainEvent.LoanId.Should().Be(loan.Id);
        domainEvent.OriginalDueDate.Should().Be(originalDueDate);
        domainEvent.NewDueDate.Should().Be(loan.DueDate);
    }

    [Fact]
    public void Return_OnTime_ShouldMarkAsReturnedWithoutFee()
    {
        // Arrange
        var loan = CreateValidLoan();
        var returnDate = loan.DueDate.AddDays(-1); // Return before due date
        var feeCalculator = new Mock<IOverdueFeeCalculator>();

        // Act
        loan.Return(returnDate, feeCalculator.Object);

        // Assert
        loan.Status.Should().Be(LoanStatus.Returned);
        loan.ReturnDate.Should().Be(returnDate);
        loan.OverdueFee.Should().BeNull();
        
        var domainEvent = loan.DomainEvents.OfType<BookReturned>().Single();
        domainEvent.LoanId.Should().Be(loan.Id);
        domainEvent.ReturnDate.Should().Be(returnDate);
    }

    private Loan CreateValidLoan()
    {
        return new Loan(
            LoanId.New(),
            MemberId.New(),
            BookCopyId.New(),
            DateTime.UtcNow,
            LoanRule.StandardMember
        );
    }
}
\`\`\`

## プロジェクト構成

### 推奨プロジェクト構造

\`\`\`
LibraryManagement.sln
├── src/
│   ├── LibraryManagement.Domain/
│   │   ├── Aggregates/
│   │   │   ├── BookCatalog/
│   │   │   ├── Member/
│   │   │   ├── Lending/
│   │   │   └── Reservation/
│   │   ├── Services/
│   │   ├── ValueObjects/
│   │   └── Events/
│   ├── LibraryManagement.Application/
│   │   ├── Services/
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── DTOs/
│   │   └── Handlers/
│   ├── LibraryManagement.Infrastructure/
│   │   ├── Repositories/
│   │   ├── Data/
│   │   ├── ExternalServices/
│   │   └── EventStore/
│   └── LibraryManagement.Web/
│       ├── Controllers/
│       ├── Models/
│       └── Views/
└── tests/
    ├── LibraryManagement.Domain.Tests/
    ├── LibraryManagement.Application.Tests/
    └── LibraryManagement.Integration.Tests/
\`\`\`

## 実践課題

### 最終課題: 完全なシステム実装

以下の機能を持つ図書館管理システムを完全に実装してください：

1. **基本機能**:
   - 図書の登録・検索・更新
   - 利用者の登録・管理
   - 貸出・返却処理
   - 予約システム

2. **高度な機能**:
   - 延滞管理と料金計算
   - 利用統計レポート
   - 通知システム（メール/SMS）
   - 在庫管理

3. **技術要件**:
   - Clean Architecture の適用
   - CQRS パターンの実装
   - Event Sourcing の部分適用
   - 包括的なテストスイート

4. **品質要件**:
   - 単体テストカバレッジ 90% 以上
   - 統合テストの完全実装
   - パフォーマンステスト
   - セキュリティ考慮

このプロジェクトを通じて、DDDの理論を実践に活かし、実際のビジネス要件を満たすシステムを構築する能力を身につけることができます。

### 提出物

1. **設計ドキュメント**:
   - ドメインモデル図
   - コンテキストマップ
   - アーキテクチャ図

2. **実装コード**:
   - 完全なソースコード
   - テストコード
   - 実行可能なアプリケーション

3. **ドキュメント**:
   - API ドキュメント
   - 運用ガイド
   - 学習した内容の振り返り

成功の鍵は、ドメインエキスパート（図書館司書）の視点でシステムを設計し、ビジネス価値を最大化することです。技術的な完璧さよりも、実際の業務に役立つシステムを目指してください。
`,
  codeExamples: [
    {
      id: 'book-aggregate',
      title: '図書アグリゲート',
      language: 'csharp',
      code: `public class Book : AggregateRoot<BookId>
{
    public Title Title { get; private set; }
    public Author Author { get; private set; }
    public ISBN ISBN { get; private set; }
    public Category Category { get; private set; }
    public BookStatus Status { get; private set; }

    private readonly List<BookCopy> _copies = new();
    public IReadOnlyList<BookCopy> Copies => _copies.AsReadOnly();

    public Book(BookId id, Title title, Author author, ISBN isbn, 
               PublicationDate publicationDate, Category category)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Author = author ?? throw new ArgumentNullException(nameof(author));
        ISBN = isbn ?? throw new ArgumentNullException(nameof(isbn));
        Category = category ?? throw new ArgumentNullException(nameof(category));
        Status = BookStatus.Available;

        AddDomainEvent(new BookRegistered(Id, Title, Author, ISBN));
    }

    public BookCopy AddCopy(Location location)
    {
        var copyNumber = _copies.Count + 1;
        var copy = new BookCopy(BookCopyId.New(), Id, copyNumber, location);
        _copies.Add(copy);

        AddDomainEvent(new BookCopyAdded(Id, copy.Id, copyNumber));
        return copy;
    }

    public bool HasAvailableCopy()
    {
        return _copies.Any(c => c.Status == BookCopyStatus.Available);
    }
}`,
      description: '図書館システムの中核となる図書アグリゲートの実装'
    },
    {
      id: 'loan-aggregate',
      title: '貸出アグリゲート',
      language: 'csharp',
      code: `public class Loan : AggregateRoot<LoanId>
{
    public MemberId MemberId { get; private set; }
    public BookCopyId BookCopyId { get; private set; }
    public DateTime LoanDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public DateTime? ReturnDate { get; private set; }
    public LoanStatus Status { get; private set; }
    public Money? OverdueFee { get; private set; }

    public Loan(LoanId id, MemberId memberId, BookCopyId bookCopyId, 
               DateTime loanDate, LoanRule loanRule)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        MemberId = memberId ?? throw new ArgumentNullException(nameof(memberId));
        BookCopyId = bookCopyId ?? throw new ArgumentNullException(nameof(bookCopyId));
        LoanDate = loanDate;
        DueDate = loanRule.CalculateDueDate(loanDate);
        Status = LoanStatus.Active;

        AddDomainEvent(new BookLoaned(Id, MemberId, BookCopyId, LoanDate, DueDate));
    }

    public void Return(DateTime returnDate, IOverdueFeeCalculator feeCalculator)
    {
        if (Status != LoanStatus.Active)
            throw new InvalidOperationException("Can only return active loans");

        ReturnDate = returnDate;
        Status = LoanStatus.Returned;

        if (returnDate > DueDate)
        {
            var daysOverdue = (returnDate - DueDate).Days;
            OverdueFee = feeCalculator.CalculateFee(daysOverdue);
            
            AddDomainEvent(new BookReturnedOverdue(Id, MemberId, BookCopyId, 
                                                 returnDate, daysOverdue, OverdueFee));
        }
        else
        {
            AddDomainEvent(new BookReturned(Id, MemberId, BookCopyId, returnDate));
        }
    }
}`,
      description: '貸出業務のビジネスルールを実装した貸出アグリゲート'
    },
    {
      id: 'reservation-service',
      title: '予約管理ドメインサービス',
      language: 'csharp',
      code: `public class ReservationService : IReservationService
{
    private readonly IBookRepository _bookRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly ILoanRepository _loanRepository;

    public async Task<Reservation> ReserveBookAsync(BookId bookId, MemberId memberId, 
                                                   DateTime reservationDate, CancellationToken cancellationToken = default)
    {
        var book = await _bookRepository.GetByIdAsync(bookId, cancellationToken);
        if (book == null)
            throw new BookNotFoundException(bookId);

        // すでに同じ本を借りているかチェック
        var existingLoan = await _loanRepository.GetActiveLoanByMemberAndBookAsync(memberId, bookId, cancellationToken);
        if (existingLoan != null)
            throw new BookAlreadyLoanedException(memberId, bookId);

        // すでに予約しているかチェック
        var existingReservation = await _reservationRepository.GetActiveReservationByMemberAndBookAsync(
            memberId, bookId, cancellationToken);
        if (existingReservation != null)
            throw new BookAlreadyReservedException(memberId, bookId);

        // 予約待ち順序を決定
        var activeReservations = await _reservationRepository.GetActiveReservationsByBookAsync(bookId, cancellationToken);
        var queuePosition = activeReservations.Count() + 1;

        var reservation = new Reservation(
            ReservationId.New(),
            bookId,
            memberId,
            reservationDate,
            queuePosition
        );

        return reservation;
    }
}`,
      description: '複雑な予約ビジネスルールを処理するドメインサービス'
    },
    {
      id: 'application-service',
      title: 'アプリケーションサービス',
      language: 'csharp',
      code: `public class LibraryApplicationService : ILibraryApplicationService
{
    private readonly IBookRepository _bookRepository;
    private readonly IMemberRepository _memberRepository;
    private readonly ILoanRepository _loanRepository;
    private readonly IReservationService _reservationService;
    private readonly IUnitOfWork _unitOfWork;

    public async Task<LoanDto> LoanBookAsync(LoanBookCommand command, CancellationToken cancellationToken = default)
    {
        // エンティティの取得
        var member = await _memberRepository.GetByIdAsync(new MemberId(command.MemberId), cancellationToken);
        if (member == null)
            throw new MemberNotFoundException(command.MemberId);

        var book = await _bookRepository.GetByIdAsync(new BookId(command.BookId), cancellationToken);
        if (book == null)
            throw new BookNotFoundException(new BookId(command.BookId));

        // ビジネスルールの検証
        var activeLoanCount = await _loanRepository.GetActiveLoanCountByMemberAsync(member.Id, cancellationToken);
        if (!member.CanBorrowMore(activeLoanCount))
            throw new LoanLimitExceededException(member.Id, member.LoanLimit);

        if (!book.HasAvailableCopy())
            throw new NoAvailableCopyException(book.Id);

        // 貸出処理
        var availableCopy = book.GetAvailableCopy();
        var loanRule = LoanRule.GetByMemberType(member.MemberType);
        var loan = new Loan(LoanId.New(), member.Id, availableCopy.Id, DateTime.UtcNow, loanRule);

        availableCopy.MarkAsLoaned();

        // 永続化
        await _loanRepository.AddAsync(loan, cancellationToken);
        await _bookRepository.UpdateAsync(book, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(loan, book, member);
    }
}`,
      description: 'ユースケースをオーケストレーションするアプリケーションサービス'
    },
    {
      id: 'domain-event-handler',
      title: 'ドメインイベントハンドラー',
      language: 'csharp',
      code: `public class BookLoanedEventHandler : INotificationHandler<BookLoaned>
{
    private readonly IEmailService _emailService;
    private readonly IMemberRepository _memberRepository;
    private readonly IBookRepository _bookRepository;

    public async Task Handle(BookLoaned notification, CancellationToken cancellationToken)
    {
        var member = await _memberRepository.GetByIdAsync(notification.MemberId, cancellationToken);
        var book = await _bookRepository.GetBookByBookCopyIdAsync(notification.BookCopyId, cancellationToken);

        if (member != null && book != null)
        {
            var emailContent = new LoanConfirmationEmail
            {
                To = member.Email,
                MemberName = member.Name,
                BookTitle = book.Title.Value,
                LoanDate = notification.LoanDate,
                DueDate = notification.DueDate
            };

            await _emailService.SendAsync(emailContent, cancellationToken);
        }
    }
}

public class BookReturnedEventHandler : INotificationHandler<BookReturned>
{
    private readonly IReservationService _reservationService;

    public async Task Handle(BookReturned notification, CancellationToken cancellationToken)
    {
        var bookId = await GetBookIdByBookCopyIdAsync(notification.BookCopyId, cancellationToken);
        if (bookId != null)
        {
            await _reservationService.ProcessReturnForReservationsAsync(bookId, cancellationToken);
        }
    }
}`,
      description: 'ドメインイベントに応答するイベントハンドラーの実装'
    }
  ],
  exercises: [
    {
      id: 'implement-complete-system',
      title: '図書館管理システムの完全実装',
      description: '要件定義から実装まで、図書館管理システムを完全に開発してください。ドメインモデリング、アーキテクチャ設計、実装、テストまでの全工程を経験します。',
      difficulty: 'hard',
      estimatedTime: 180,
      starterCode: `// Phase 1: Domain Modeling
// TODO: ドメインエキスパートへのインタビューを基に要件を整理
// TODO: イベントストーミングでドメインイベントを特定
// TODO: 境界づけられたコンテキストの設計

// Phase 2: Domain Implementation
// TODO: エンティティとアグリゲートの実装
// TODO: 値オブジェクトの実装
// TODO: ドメインサービスの実装
// TODO: ドメインイベントの定義

// Phase 3: Application Layer
// TODO: アプリケーションサービスの実装
// TODO: コマンド/クエリの定義
// TODO: DTOの実装

// Phase 4: Infrastructure Layer
// TODO: リポジトリの実装
// TODO: データベース設計
// TODO: 外部サービス連携

// Phase 5: Presentation Layer
// TODO: Web API コントローラーの実装
// TODO: フロントエンド（オプション）

// Phase 6: Testing
// TODO: 単体テストの実装
// TODO: 統合テストの実装
// TODO: エンドツーエンドテスト`,
      solution: `// 完全な実装例は非常に大きくなるため、主要部分のみ示します

// Domain Layer - Book Aggregate
public class Book : AggregateRoot<BookId>
{
    public Title Title { get; private set; }
    public Author Author { get; private set; }
    public ISBN ISBN { get; private set; }
    
    private readonly List<BookCopy> _copies = new();
    public IReadOnlyList<BookCopy> Copies => _copies.AsReadOnly();

    public Book(BookId id, Title title, Author author, ISBN isbn, Category category)
    {
        Id = id;
        Title = title;
        Author = author;
        ISBN = isbn;
        Category = category;
        Status = BookStatus.Available;
        
        AddDomainEvent(new BookRegistered(Id, Title, Author, ISBN));
    }

    public BookCopy AddCopy(Location location)
    {
        var copy = new BookCopy(BookCopyId.New(), Id, _copies.Count + 1, location);
        _copies.Add(copy);
        AddDomainEvent(new BookCopyAdded(Id, copy.Id, copy.CopyNumber));
        return copy;
    }
}

// Application Layer - Library Service
public class LibraryApplicationService : ILibraryApplicationService
{
    public async Task<LoanDto> LoanBookAsync(LoanBookCommand command)
    {
        var member = await _memberRepository.GetByIdAsync(new MemberId(command.MemberId));
        var book = await _bookRepository.GetByIdAsync(new BookId(command.BookId));
        
        // Business rule validation
        if (!member.CanBorrowMore(await GetActiveLoanCount(member.Id)))
            throw new LoanLimitExceededException();
            
        if (!book.HasAvailableCopy())
            throw new NoAvailableCopyException();

        // Create loan
        var copy = book.GetAvailableCopy();
        var loan = new Loan(LoanId.New(), member.Id, copy.Id, DateTime.UtcNow, 
                           LoanRule.GetByMemberType(member.MemberType));
        
        copy.MarkAsLoaned();
        
        await _loanRepository.AddAsync(loan);
        await _unitOfWork.SaveChangesAsync();
        
        return MapToDto(loan);
    }
}`,
      hints: [
        'まずはドメインエキスパートの視点で要件を整理してください',
        'イベントストーミングで重要なドメインイベントを特定してください',
        'アグリゲート境界を慎重に設計してください',
        'テストファーストで開発を進めてください',
        '段階的に機能を追加していってください'
      ]
    },
    {
      id: 'advanced-features',
      title: '高度な機能の実装',
      description: '基本機能に加えて、延滞管理、利用統計、通知システムなどの高度な機能を実装してください。',
      difficulty: 'hard',
      estimatedTime: 120,
      starterCode: `// Advanced Feature 1: Overdue Management
public class OverdueManagementService
{
    // TODO: 延滞検知機能
    // TODO: 延滞通知機能
    // TODO: 延滞料金計算機能
}

// Advanced Feature 2: Usage Statistics
public class UsageStatisticsService
{
    // TODO: 貸出統計機能
    // TODO: 人気図書ランキング
    // TODO: 利用者分析機能
}

// Advanced Feature 3: Notification System
public class NotificationService
{
    // TODO: メール通知機能
    // TODO: SMS通知機能
    // TODO: プッシュ通知機能
}

// Advanced Feature 4: Inventory Management
public class InventoryManagementService
{
    // TODO: 在庫レベル監視
    // TODO: 自動発注機能
    // TODO: 廃棄処理機能
}`,
      solution: `// Overdue Management Implementation
public class OverdueManagementService : IOverdueManagementService
{
    public async Task<IEnumerable<OverdueNotification>> ProcessOverdueLoansAsync()
    {
        var overdueLoans = await _loanRepository.GetOverdueLoansAsync();
        var notifications = new List<OverdueNotification>();
        
        foreach (var loan in overdueLoans)
        {
            var member = await _memberRepository.GetByIdAsync(loan.MemberId);
            var book = await _bookRepository.GetBookByBookCopyIdAsync(loan.BookCopyId);
            
            var daysOverdue = loan.DaysOverdue(DateTime.UtcNow);
            var fee = _feeCalculator.CalculateFee(daysOverdue);
            
            var notification = new OverdueNotification
            {
                MemberId = member.Id,
                MemberEmail = member.Email,
                BookTitle = book.Title.Value,
                DaysOverdue = daysOverdue,
                Fee = fee
            };
            
            notifications.Add(notification);
            await _notificationService.SendOverdueNotificationAsync(notification);
        }
        
        return notifications;
    }
}

// Usage Statistics Implementation
public class UsageStatisticsService : IUsageStatisticsService
{
    public async Task<PopularBooksReport> GetPopularBooksAsync(DateTime from, DateTime to)
    {
        var loanCounts = await _loanRepository.GetLoanCountsByBookAsync(from, to);
        
        var popularBooks = loanCounts
            .OrderByDescending(x => x.LoanCount)
            .Take(10)
            .Select(x => new PopularBookItem
            {
                BookId = x.BookId,
                Title = x.BookTitle,
                LoanCount = x.LoanCount,
                PopularityRank = loanCounts.ToList().IndexOf(x) + 1
            });
            
        return new PopularBooksReport
        {
            Period = new DatePeriod(from, to),
            Books = popularBooks.ToList()
        };
    }
}`,
      hints: [
        '延滞管理では時間ベースのドメインイベントを活用してください',
        '統計機能はCQRSパターンで読み取り専用モデルを活用してください',
        '通知システムは非同期処理を考慮してください',
        'バッチ処理機能も実装を検討してください'
      ]
    },
    {
      id: 'performance-optimization',
      title: 'パフォーマンス最適化',
      description: '大規模データを扱うことを想定し、パフォーマンス最適化を実装してください。キャッシュ、非同期処理、データベース最適化を含めてください。',
      difficulty: 'hard',
      estimatedTime: 90,
      starterCode: `// Performance Optimization Tasks:

// 1. Caching Strategy
public class CachedBookRepository : IBookRepository
{
    // TODO: Redis/Memory cache implementation
}

// 2. Async Processing
public class AsyncLoanProcessor
{
    // TODO: Queue-based async loan processing
}

// 3. Database Optimization
public class OptimizedLoanRepository : ILoanRepository
{
    // TODO: Query optimization
    // TODO: Bulk operations
    // TODO: Read replicas usage
}

// 4. Background Services
public class LibraryBackgroundService : BackgroundService
{
    // TODO: Scheduled tasks
    // TODO: Health checks
}`,
      solution: `// Caching Implementation
public class CachedBookRepository : IBookRepository
{
    private readonly IBookRepository _repository;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedBookRepository> _logger;

    public async Task<Book> GetByIdAsync(BookId bookId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"book:{bookId}";
        
        if (_cache.TryGetValue(cacheKey, out Book cachedBook))
        {
            _logger.LogDebug("Book {BookId} retrieved from cache", bookId);
            return cachedBook;
        }

        var book = await _repository.GetByIdAsync(bookId, cancellationToken);
        if (book != null)
        {
            _cache.Set(cacheKey, book, TimeSpan.FromMinutes(30));
            _logger.LogDebug("Book {BookId} cached for 30 minutes", bookId);
        }

        return book;
    }
}

// Async Processing with Hangfire
public class AsyncLoanProcessor
{
    public async Task ProcessLoanAsync(LoanBookCommand command)
    {
        BackgroundJob.Enqueue<ILibraryApplicationService>(
            service => service.LoanBookAsync(command, CancellationToken.None));
    }
    
    public async Task ProcessBulkReturnsAsync(IEnumerable<ReturnBookCommand> commands)
    {
        foreach (var command in commands)
        {
            BackgroundJob.Enqueue<ILibraryApplicationService>(
                service => service.ReturnBookAsync(command, CancellationToken.None));
        }
    }
}

// Database Optimization
public class OptimizedLoanRepository : ILoanRepository
{
    public async Task<IEnumerable<Loan>> GetByMemberIdAsync(MemberId memberId, CancellationToken cancellationToken)
    {
        // Use compiled query for better performance
        return await _context.Loans
            .Where(l => l.MemberId == memberId.Value)
            .Include(l => l.BookCopy)
            .ThenInclude(bc => bc.Book)
            .AsNoTracking() // Read-only optimization
            .ToListAsync(cancellationToken);
    }
    
    public async Task BulkUpdateStatusAsync(IEnumerable<LoanId> loanIds, LoanStatus status)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE Loans SET Status = {0} WHERE Id IN ({1})",
            status.ToString(),
            string.Join(",", loanIds.Select(id => $"'{id.Value}'"))
        );
    }
}`,
      hints: [
        'キャッシュ戦略では適切な有効期限と無効化戦略を考慮してください',
        '非同期処理ではエラーハンドリングとリトライ機能を実装してください',
        'データベース最適化ではインデックス設計も考慮してください',
        'メトリクス収集でパフォーマンスを継続監視してください'
      ]
    }
  ]
};