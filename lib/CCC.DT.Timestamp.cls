/// Datatype for $HOROLOG
/// authored by Robert Hurst 11-Feb-2021
Class CCC.DT.Timestamp [ ClassType = datatype, ClientDataType = DATE, OdbcType = DATE, SqlCategory = DATE ]
{

/// Pack date string
ClassMethod DisplayToLogical(%DS As %String) As CCC.DT.Timestamp
{
    try {
        set %DN = $zdth(%DS, 3)
    }
    catch {
        try {
            set %DN = $zdth(%DS)
        }
        catch {
            set %DN = ""
        }
    }
    quit %DN
}

/// Unpack as yyyy-mm-dd hh:mm:ss
ClassMethod LogicalToDisplay(%DN As CCC.DT.Timestamp) As %String [ CodeMode = expression ]
{
$zdt(%DN, 3)
}

}
