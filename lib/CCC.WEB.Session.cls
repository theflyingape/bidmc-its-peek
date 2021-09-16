/// Weblink Session (^webs)
/// where applicable, makes use of shared indices
/// authored by Robert Hurst 09-Feb-2021
Class CCC.WEB.Session Extends %Persistent [ ClassType = persistent, ProcedureBlock, SqlRowIdName = IDKey, StorageStrategy = BIDMC ]
{

/// ECP shared WEB indices kept on database mirrors
Parameter iWebs = "^[""WEB""]websmaster";

Parameter iWebt = "^[""WEB""]webtmaster";

/// local WST dataset globals on web application instances
Parameter webs = "^[""WEB""]webs";

Parameter webt = "^[""WEB""]webt";

/// session identifier
Property ID As %Integer;

Property instance As %String [ Calculated, SqlComputeCode = { set {*} = $g(@##class(CCC.WEB.Session).Getinstance({ID}))}, SqlComputed ];

Property ip As %String;

Property ke As %Integer;

Property tm As CCC.DT.Timestamp;

Property app As %String [ Calculated, SqlComputeCode = { set {*} = $g(@##class(CCC.WEB.Session).Getapp({ID}))}, SqlComputed ];

Property username As %String;

Property usersim As %String;

Property webt As %CacheString [ Calculated, SqlComputeCode = { set {*} = ##class(CCC.WEB.Session).Getwebt({ID})}, SqlComputed ];

///  Primary key
Index IDKey On ID [ IdKey, Unique ];

Method appGet() As %String
{
	quit ..Getapp(i%ID)
}

///  yeah, let's keep this human-readadble
Method tmGet() As %String
{
	quit ..tmLogicalToDisplay(i%tm)
}

Method instanceGet()
{
	quit ..Getinstance(i%ID)
}

Method webtGet()
{
	quit ..Getwebt(i%ID)
}

ClassMethod Getapp(ID) As %String
{
	; invoked directly with a webt instead?
	if ('$d(@##class(CCC.WEB.Session).#webs@(ID))) set ID = $g(@##class(CCC.WEB.Session).#webt@(ID, 1, "%webs"))

	set app = $g(@##class(CCC.WEB.Session).#webs@(ID, "login", "APP"))
	if (app = "") set app = $g(@##class(CCC.WEB.Session).#webs@(ID, "from"))
	if (app = "") {
		set s = $g(@##class(CCC.WEB.Session).#webs@(ID, "s"))
		set app = $g(@##class(CCC.WEB.Session).#webs@(ID, "s", s, "%prg"))
	}
	quit app
}

ClassMethod Getinstance(ID) As %String
{
	set instance = $g(@##class(CCC.WEB.Session).#iWebs@(ID, "instance"))
	set webt = $p(..Getwebt(ID), ",", *)
	if webt {
		set last = $g(@..#iWebt@(webt, "login", "instance"))
		if instance '= last set instance = last
	}
	quit instance
}

ClassMethod Getwebt(ID) As %String
{
	set (webt, list)=""
	for n = 1:1 {
		set webt = $o(@..#iWebs@(ID, "webt", webt)) quit:webt=""
		set $p(list, ",", n) = webt
	}
	quit list
}

///  pass specific date to search as either $horolog or mm/dd/yyyy; or
///  pass "*" for earliest available online
ClassMethod FirstLogin(dn As %String = "", ip As %String = "", username As %String = "") As %Integer
{
	; get earliest date still available
	set s = 0
	for {
		set s = $o(@..#webs@(s)) quit:s=""
		set tm = $g(@..#webs@(s, "login", "tm")) quit:+tm
	}

	if (dn = "*") set dn = +tm
	set dn = $s(dn:dn, 1:+$h)
	if (dn '= +dn) {
		try {
			set dn = $zdh(dn)
		}
		catch {
			set dn = 0
		}
	}
	if (+dn < 1) || (+dn > +$h) quit -1
	if ('s) || (+tm > +dn) quit -1

	set id = 0

	; start @ latest entry working backward
	set s = "@"
	for {
		set s = $o(@..#webs@(s), -1) quit:s=""
		set tm = $g(@..#webs@(s, "login", "tm"))
		if 'tm continue

		; skip if this instance doesn't have the complete webt trail
		if $p($j, ":", 2) '= ..Getinstance(s) continue

		if ip '= "", ip '= $g(@..#webs@(s, "login", "ip")) continue
		if username '= "", username '= $g(@..#webs@(s, "login", "username")) continue
		if (+tm < +dn) quit
		set id = s
	}
	quit id
}

///  return an array of sessions, but given an ip and/or username
ClassMethod Trail(dn As %String, ip As %String = "", username As %String = "") As %RegisteredObject
{
	set obj = []

	if (ip = "") && (username = "") quit obj
	set s = ..FirstLogin(.dn, ip, username)
	if (s < 1) quit obj

	set match = s
	set result = ""

	for {
		do obj.%Push(..ToJSON(s))

		set match = ""
		for {
			set s = $o(@..#webs@(s)) quit:s=""

			set tm = $g(@..#webs@(s, "login", "tm"))
			if 'tm continue
			if +tm > dn quit

			; skip if this instance doesn't have the complete webt trail
			if $p($j, ":", 2) '= ..Getinstance(s) continue

			if ip '= "", ip '= $g(@..#webs@(s, "login", "ip")) continue
			if username '= "", username '= $g(@..#webs@(s, "login", "username")) continue

			set match = s
			quit
		}
		if 'match quit
	}

	quit $s($USERNAME="UnknownUser":obj.%ToJSON(), 1:obj)
}

ClassMethod ToJSON(id) As %DynamicObject
{
	set obj = {}
	set webs = $s($IsObject(id):id, 1:..%OpenId(id))

	if $IsObject(webs) {
		set obj.ID = webs.ID
		set obj.instance = webs.instance
		set obj.ip = webs.ip
		set obj.ke = webs.ke
		set obj.tm = webs.tm
		set obj.app = webs.app
		set obj.username = webs.username
		set obj.usersim = webs.usersim
		set obj.webt = webs.webt
	}

	quit obj
}

Storage BIDMC
{
<SQLMap name="DataMap">
<Data name="ip">
<Node>"login","ip"</Node>
</Data>
<Data name="ke">
<Node>"login","ke"</Node>
</Data>
<Data name="tm">
<Node>"login","tm"</Node>
</Data>
<Data name="username">
<Delimiter>":"</Delimiter>
<Node>"login","username"</Node>
<Piece>1</Piece>
</Data>
<Data name="usersim">
<Delimiter>":"</Delimiter>
<Node>"login","username"</Node>
<Piece>2</Piece>
</Data>
<Global>^["WEB"]webs</Global>
<RowIdSpec name="1">
<Expression>{L1}</Expression>
<Field>ID</Field>
</RowIdSpec>
<Subscript name="1">
<Expression>{ID}</Expression>
</Subscript>
<Type>data</Type>
</SQLMap>
<StreamLocation>^CCC.WEB.SessionS</StreamLocation>
<Type>%CacheSQLStorage</Type>
}

}
