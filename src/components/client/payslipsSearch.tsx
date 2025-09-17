"use client"
import type { ListViewClientProps } from 'payload'
import type { Employee, Payslip } from '@/payload-types'
import * as React from "react"
import { Select, Space, DatePicker, Descriptions, Card, Typography, Alert, Divider, Spin, Button, ConfigProvider } from "antd"
import { Printer, Download } from 'lucide-react'
import { useLocale, useTranslation, useAuth } from '@payloadcms/ui'
import dayjs from 'dayjs'
import { searchEmployees, getPayslipForEmployeeAndMonth } from '@/lib/actions'
import { useReactToPrint } from 'react-to-print'
import useAsync from 'react-use/lib/useAsync'

const { Title, Text } = Typography

// Separate component for payslip content (for printing)
const PayslipContent = React.forwardRef<HTMLDivElement, {
    payslip: Payslip;
    selectedMonth: dayjs.Dayjs;
    code: string;
    lang: string;
}>(({ payslip, selectedMonth, code, lang }, ref) => {
    // Helper function to get localized text
    const getLocalizedText = (field: any) => {
        if (typeof field === 'object' && field !== null) {
            // Try lang first, then code, then fallback to 'en'
            return field[lang] || field[code] || field.en || field
        }
        return field
    }

    // Helper function to get localized status
    const getLocalizedStatus = (status: string) => {
        const statusTranslations: Record<string, Record<string, string>> = {
            'generated': { ar: 'مولد', en: 'Generated' },
            'sent': { ar: 'مرسل', en: 'Sent' },
            'downloaded': { ar: 'تم التحميل', en: 'Downloaded' },
            'viewed': { ar: 'تمت المشاهدة', en: 'Viewed' }
        }
        return statusTranslations[status]?.[lang] || statusTranslations[status]?.[code] || status.toUpperCase()
    }

    console.log("🖨️ PRINT COMPONENT - code:", code, "lang:", lang, "direction:", (code === 'ar' || lang === 'ar') ? 'rtl' : 'ltr')

    // Use lang as the primary locale indicator
    const isArabic = lang === 'ar' || code === 'ar'

    return (
        <div ref={ref} style={{ padding: '20px', backgroundColor: 'white', direction: isArabic ? 'rtl' : 'ltr' }}>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {isArabic ? 'كشف الراتب' : 'Payslip'}
                </h1>
                <p style={{ fontSize: '16px', color: '#666' }}>
                    {selectedMonth.format('MMMM YYYY')}
                </p>
            </div>

            <Descriptions bordered column={2} style={{ marginBottom: '20px' }}>
                <Descriptions.Item
                    label={isArabic ? 'الموظف' : 'Employee'}
                    span={2}
                >
                    {typeof payslip.employee === 'object'
                        ? getLocalizedText(payslip.employee.fullName)
                        : payslip.employee}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'رقم الموظف' : 'Employee ID'}>
                    {typeof payslip.employee === 'object'
                        ? payslip.employee.employeeId
                        : ''}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'الشركة' : 'Company'}>
                    {typeof payslip.company === 'object'
                        ? getLocalizedText(payslip.company.companyLegalName)
                        : payslip.company}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'الحالة' : 'Status'} span={2}>
                    {getLocalizedStatus(payslip.status || '')}
                </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>
                {isArabic ? 'تفاصيل الراتب' : 'Payroll Details'}
            </h3>

            <Descriptions bordered column={2}>
                <Descriptions.Item label={isArabic ? 'الراتب الأساسي' : 'Basic Salary'}>
                    {payslip.payrollDetails?.basicSalary?.toLocaleString()} {isArabic ? 'ريال' : 'SAR'}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'البدلات' : 'Allowances'}>
                    {payslip.payrollDetails?.allowances?.toLocaleString() || 0} {isArabic ? 'ريال' : 'SAR'}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'إجمالي الراتب' : 'Gross Pay'}>
                    {payslip.payrollDetails?.grossPay?.toLocaleString()} {isArabic ? 'ريال' : 'SAR'}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'الاستقطاعات الأساسية' : 'Base Deductions'}>
                    {payslip.payrollDetails?.baseDeductions?.toLocaleString() || 0} {isArabic ? 'ريال' : 'SAR'}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'إجمالي الاستقطاعات' : 'Total Deductions'}>
                    {payslip.payrollDetails?.totalDeductions?.toLocaleString() || 0} {isArabic ? 'ريال' : 'SAR'}
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'صافي الراتب' : 'Net Pay'}>
                    <strong style={{ fontSize: '16px', color: '#52c41a' }}>
                        {payslip.payrollDetails?.netPay?.toLocaleString()} {isArabic ? 'ريال' : 'SAR'}
                    </strong>
                </Descriptions.Item>

                <Descriptions.Item label={isArabic ? 'رقم الآيبان' : 'IBAN'} span={2}>
                    {payslip.payrollDetails?.iban}
                </Descriptions.Item>
            </Descriptions>

            {payslip.payrollDetails?.additionalDeductions && payslip.payrollDetails.additionalDeductions.length > 0 && (
                <>
                    <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>
                        {isArabic ? 'الاستقطاعات الإضافية' : 'Additional Deductions'}
                    </h3>
                    <Descriptions bordered column={1}>
                        {payslip.payrollDetails.additionalDeductions.map((deduction, index) => (
                            <Descriptions.Item
                                key={deduction.id || index}
                                label={deduction.description}
                            >
                                {deduction.amount?.toLocaleString()} {isArabic ? 'ريال' : 'SAR'}
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                </>
            )}

            {payslip.notes && (
                <>
                    <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>
                        {isArabic ? 'ملاحظات' : 'Notes'}
                    </h3>
                    <p>{payslip.notes}</p>
                </>
            )}

            <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '10px', fontSize: '12px', color: '#999' }}>
                <p>{isArabic ? 'تم الطباعة بتاريخ: ' : 'Printed on: '}{dayjs().format('DD/MM/YYYY HH:mm')}</p>
            </div>
        </div>
    )
})

PayslipContent.displayName = 'PayslipContent'

export default function Component(props: ListViewClientProps) {
    const { code } = useLocale()
    const { t, i18n } = useTranslation()
    const { user } = useAuth()

    const lang = i18n.language

    console.log("🔄 COMPONENT RENDER - code:", code, "lang:", lang)
    // States for form controls
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("")
    const [selectedMonth, setSelectedMonth] = React.useState<dayjs.Dayjs | null>(null)
    const [searchValue, setSearchValue] = React.useState<string>("")

    // State to track if payslip search should be performed
    const [hasSearchedPayslip, setHasSearchedPayslip] = React.useState<boolean>(false)

    // Ref for printing
    const componentRef = React.useRef<HTMLDivElement>(null)

    // Add a mounted ref to handle cleanup
    const isMountedRef = React.useRef(true)

    // Reset mounted ref on component mount/unmount
    React.useEffect(() => {
        console.log("🚀 COMPONENT MOUNT - Setting isMountedRef.current = true")
        isMountedRef.current = true
        return () => {
            console.log("🛑 COMPONENT UNMOUNT - Setting isMountedRef.current = false")
            isMountedRef.current = false
        }
    }, [])

    // Reset component state on mount to prevent stale data
    React.useEffect(() => {
        console.log("🔄 COMPONENT STATE RESET - Clearing all form states")
        setSelectedEmployeeId("")
        setSelectedMonth(null)
        setSearchValue("")
        setHasSearchedPayslip(false)
    }, [])

    // Simple manual employee fetching without useAsync
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [employeesLoading, setEmployeesLoading] = React.useState<boolean>(false)
    const [employeesError, setEmployeesError] = React.useState<string | null>(null)

    React.useEffect(() => {
        const fetchEmployees = async () => {
            console.log("👥 EMPLOYEES FETCH START - searchValue:", searchValue)

            setEmployeesLoading(true)
            setEmployeesError(null)

            try {
                const result = await searchEmployees(user, searchValue, code)
                setEmployees(result.docs as Employee[])
            } catch (error) {
                console.error("❌ EMPLOYEES SEARCH ERROR:", error)
                setEmployeesError(lang === 'ar' ? 'خطأ في تحميل الموظفين' : 'Error loading employees')
            } finally {
                setEmployeesLoading(false)
            }
        }

        fetchEmployees()
    }, [searchValue, code, lang])

    // Log state changes
    React.useEffect(() => {
        console.log("📊 EMPLOYEES STATE UPDATE:", {
            searchValue,
            employeesCount: employees.length,
            loading: employeesLoading,
            error: employeesError,
            isMounted: isMountedRef.current
        })
    }, [searchValue, employees.length, employeesLoading, employeesError])

    // Use useAsync for payslip fetching - simpler and cleaner
    const payslipAsync = useAsync(async () => {
        if (!selectedEmployeeId || !selectedMonth || !isMountedRef.current) {
            return null
        }

        const monthString = selectedMonth.format('YYYY-MM-DD')
        const result = await getPayslipForEmployeeAndMonth(selectedEmployeeId, monthString, code)
        return result as Payslip | null
    }, [selectedEmployeeId, selectedMonth, code])

    const payslip = payslipAsync.value || null
    const payslipLoading = payslipAsync.loading && isMountedRef.current
    const payslipError = payslipAsync.error && isMountedRef.current ? (lang === 'ar' ? 'خطأ في تحميل كشف الراتب' : 'Error loading payslip') : null

    // Update search state when both fields are selected
    React.useEffect(() => {
        if (selectedEmployeeId && selectedMonth) {
            setHasSearchedPayslip(true)
        } else {
            setHasSearchedPayslip(false)
        }
    }, [selectedEmployeeId, selectedMonth])

    // Transform employees to options for Select component
    const employeeOptions = React.useMemo(() => {
        return employees.map((employee) => ({
            value: employee.id,
            label: employee.fullName,
            searchText: `${employee.fullName} ${employee.employeeId || ''}`.toLowerCase()
        }))
    }, [employees])

    // Handle employee search
    const handleEmployeeSearch = React.useCallback((value: string) => {
        console.log("🔍 EMPLOYEE SEARCH TRIGGERED - value:", value)
        setSearchValue(value)
    }, [])

    // Handle employee selection change
    const handleEmployeeChange = (value: string) => {
        console.log("👤 EMPLOYEE SELECTION CHANGED - value:", value)
        setSelectedEmployeeId(value)
        if (!value) {
            setHasSearchedPayslip(false)
        }
    }

    // Handle month selection change
    const handleMonthChange = (date: dayjs.Dayjs | null) => {
        setSelectedMonth(date)
        if (!date) {
            setHasSearchedPayslip(false)
        }
    }

    // Custom filter for employee select
    const filterOption = (input: string, option?: any) => {
        return option?.searchText?.includes(input.toLowerCase()) ?? false
    }

    // Handle print using react-to-print
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        onBeforePrint: () => {
            console.log("🖨️ BEFORE PRINT - code:", code, "lang:", lang, "i18n.language:", i18n.language)
            return Promise.resolve()
        }
    })

    const handleExportCSV = () => {
        if (!payslip) return

        // Helper function to get localized text
        const getLocalizedText = (field: any) => {
            if (typeof field === 'object' && field !== null) {
                return field[lang] || field[code] || field.en || field
            }
            return field
        }

        // Helper function to get localized status
        const getLocalizedStatus = (status: string) => {
            const statusTranslations: Record<string, Record<string, string>> = {
                'generated': { ar: 'مولد', en: 'Generated' },
                'sent': { ar: 'مرسل', en: 'Sent' },
                'downloaded': { ar: 'تم التحميل', en: 'Downloaded' },
                'viewed': { ar: 'تمت المشاهدة', en: 'Viewed' }
            }
            return statusTranslations[status]?.[lang] || statusTranslations[status]?.[code] || status.toUpperCase()
        }

        // Prepare CSV data with localized headers
        const csvHeaders = lang === 'ar' ? [
            'اسم الموظف',
            'رقم الموظف',
            'الشركة',
            'الشهر',
            'الراتب الأساسي',
            'البدلات',
            'إجمالي الراتب',
            'الاستقطاعات الأساسية',
            'إجمالي الاستقطاعات',
            'صافي الراتب',
            'رقم الآيبان',
            'الحالة'
        ] : [
            'Employee Name',
            'Employee ID',
            'Company',
            'Month',
            'Basic Salary',
            'Allowances',
            'Gross Pay',
            'Base Deductions',
            'Total Deductions',
            'Net Pay',
            'IBAN',
            'Status'
        ]

        const employee = typeof payslip.employee === 'object' ? payslip.employee : null
        const company = typeof payslip.company === 'object' ? payslip.company : null

        const csvData = [
            getLocalizedText(employee?.fullName) || '',
            employee?.employeeId || '',
            getLocalizedText(company?.companyLegalName) || '',
            selectedMonth?.format('MMMM YYYY') || '',
            payslip.payrollDetails?.basicSalary || 0,
            payslip.payrollDetails?.allowances || 0,
            payslip.payrollDetails?.grossPay || 0,
            payslip.payrollDetails?.baseDeductions || 0,
            payslip.payrollDetails?.totalDeductions || 0,
            payslip.payrollDetails?.netPay || 0,
            payslip.payrollDetails?.iban || '',
            getLocalizedStatus(payslip.status || '')
        ]

        // Create CSV content
        const csvContent = [
            csvHeaders.join(','),
            csvData.map(value => `"${value}"`).join(',')
        ].join('\n')

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `payslip_${employee?.employeeId}_${selectedMonth?.format('YYYY-MM')}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: 'black', // Black primary color
                    colorPrimaryHover: 'gray', // Slightly lighter black for hover
                    colorPrimaryActive: '#595959', // Even lighter for active state
                },
            }}
        >
            <div>
                <Card className="mb-6">
                    <Title level={3} style={{ paddingBottom: 30 }}>
                        {lang === 'ar' ? 'البحث عن كشف راتب الموظف' : 'Employee Payslip Search'}
                    </Title>
                    <Space size="large" wrap>
                        <div>
                            <DatePicker
                                size="large"
                                picker="month"
                                style={{ width: 200 }}
                                placeholder={lang === 'ar' ? 'اختر الشهر' : 'Select month'}
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                allowClear
                            />
                        </div>

                        <div>
                            <Select
                                size="large"
                                showSearch
                                style={{ width: 250 }}
                                placeholder={lang === 'ar' ? 'اختر الموظف' : 'Select an employee...'}
                                value={selectedEmployeeId || undefined}
                                onChange={handleEmployeeChange}
                                onSearch={handleEmployeeSearch}
                                filterOption={filterOption}
                                notFoundContent={
                                    employeesLoading
                                        ? <Spin size="small" />
                                        : (lang === 'ar' ? 'لا يوجد موظفين' : 'No employees found')
                                }
                                onOpenChange={(visible) => {
                                    console.log("👁️ EMPLOYEE DROPDOWN VISIBILITY:", visible, "employeesLoading:", employeesLoading, "employeesCount:", employees.length)
                                }}
                                onFocus={() => {
                                    console.log("🎯 EMPLOYEE SELECT FOCUSED - employeesLoading:", employeesLoading, "employeesCount:", employees.length)
                                }}
                                onBlur={() => {
                                    console.log("🌀 EMPLOYEE SELECT BLURRED")
                                }}
                                loading={employeesLoading}
                                allowClear
                                options={employeeOptions}
                            />
                        </div>
                    </Space>

                    {employeesError && (
                        <Alert
                            message={employeesError}
                            type="error"
                            showIcon
                            className="mt-4"
                        />
                    )}
                </Card>

                {/* Payslip Display - Only show when both fields are selected and search has been initiated */}
                {selectedEmployeeId && selectedMonth && hasSearchedPayslip && payslipLoading && (
                    <Alert message={lang === 'ar' ? 'جاري تحميل كشف الراتب...' : 'Loading payslip...'} type="info" showIcon />
                )}

                {selectedEmployeeId && selectedMonth && hasSearchedPayslip && payslipError && (
                    <Alert
                        message={payslipError}
                        type="error"
                        showIcon
                    />
                )}

                {selectedEmployeeId && selectedMonth && hasSearchedPayslip && !payslipLoading && !payslip && !payslipError && (
                    <Alert
                        message={lang === 'ar' ? 'لم يتم العثور على كشف راتب' : 'No payslip found'}
                        description={
                            lang === 'ar'
                                ? `لم يتم العثور على كشف راتب للموظف المحدد والشهر (${selectedMonth.format('MMMM YYYY')})`
                                : `No payslip found for the selected employee and month (${selectedMonth.format('MMMM YYYY')})`
                        }
                        type="warning"
                        showIcon
                    />
                )}

                {payslip && selectedEmployeeId && selectedMonth && (
                    <>
                        <Card
                            title={
                                lang === 'ar'
                                    ? `كشف الراتب - ${selectedMonth.format('MMMM YYYY')}`
                                    : `Payslip - ${selectedMonth.format('MMMM YYYY')}`
                            }
                            className="mt-4"
                            extra={
                                <Space>
                                    <Button
                                        icon={<Printer size={16} />}
                                        onClick={handlePrint}
                                        type="primary"
                                    >
                                        {lang === 'ar' ? 'طباعة' : 'Print'}
                                    </Button>
                                    <Button
                                        icon={<Download size={16} />}
                                        onClick={handleExportCSV}
                                    >
                                        {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                                    </Button>
                                </Space>
                            }
                        >
                            <Descriptions bordered column={2}>
                                <Descriptions.Item
                                    label={lang === 'ar' ? 'الموظف' : 'Employee'}
                                    span={2}
                                >
                                    {typeof payslip.employee === 'object'
                                        ? (typeof payslip.employee.fullName === 'object'
                                            ? payslip.employee.fullName[code] || payslip.employee.fullName.en || payslip.employee.fullName
                                            : payslip.employee.fullName)
                                        : payslip.employee}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'الشركة' : 'Company'}>
                                    {typeof payslip.company === 'object'
                                        ? (typeof payslip.company.companyLegalName === 'object'
                                            ? payslip.company.companyLegalName[code] || payslip.company.companyLegalName.en || payslip.company.companyLegalName
                                            : payslip.company.companyLegalName)
                                        : payslip.company}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'الحالة' : 'Status'}>
                                    <Text type={payslip.status === 'sent' ? 'success' : 'default'}>
                                        {(() => {
                                            const statusTranslations: Record<string, Record<string, string>> = {
                                                'generated': { ar: 'مولد', en: 'Generated' },
                                                'sent': { ar: 'مرسل', en: 'Sent' },
                                                'downloaded': { ar: 'تم التحميل', en: 'Downloaded' },
                                                'viewed': { ar: 'تمت المشاهدة', en: 'Viewed' }
                                            }
                                            return statusTranslations[payslip.status || '']?.[code] || payslip.status?.toUpperCase()
                                        })()}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider>{lang === 'ar' ? 'تفاصيل الراتب' : 'Payroll Details'}</Divider>

                            <Descriptions bordered column={2}>
                                <Descriptions.Item label={lang === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}>
                                    {payslip.payrollDetails?.basicSalary?.toLocaleString()} {code === 'ar' ? 'ريال' : 'SAR'}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'البدلات' : 'Allowances'}>
                                    {payslip.payrollDetails?.allowances?.toLocaleString() || 0} {code === 'ar' ? 'ريال' : 'SAR'}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'إجمالي الراتب' : 'Gross Pay'}>
                                    {payslip.payrollDetails?.grossPay?.toLocaleString()} {code === 'ar' ? 'ريال' : 'SAR'}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'الاستقطاعات الأساسية' : 'Base Deductions'}>
                                    {payslip.payrollDetails?.baseDeductions?.toLocaleString() || 0} {code === 'ar' ? 'ريال' : 'SAR'}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'إجمالي الاستقطاعات' : 'Total Deductions'}>
                                    {payslip.payrollDetails?.totalDeductions?.toLocaleString() || 0} {code === 'ar' ? 'ريال' : 'SAR'}
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'صافي الراتب' : 'Net Pay'}>
                                    <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                                        {payslip.payrollDetails?.netPay?.toLocaleString()} {code === 'ar' ? 'ريال' : 'SAR'}
                                    </Text>
                                </Descriptions.Item>

                                <Descriptions.Item label={lang === 'ar' ? 'رقم الآيبان' : 'IBAN'} span={2}>
                                    {payslip.payrollDetails?.iban}
                                </Descriptions.Item>
                            </Descriptions>

                            {payslip.payrollDetails?.additionalDeductions && payslip.payrollDetails.additionalDeductions.length > 0 && (
                                <>
                                    <Divider>{lang === 'ar' ? 'الاستقطاعات الإضافية' : 'Additional Deductions'}</Divider>
                                    <Descriptions bordered column={1}>
                                        {payslip.payrollDetails.additionalDeductions.map((deduction, index) => (
                                            <Descriptions.Item
                                                key={deduction.id || index}
                                                label={deduction.description}
                                            >
                                                {deduction.amount?.toLocaleString()} {code === 'ar' ? 'ريال' : 'SAR'}
                                            </Descriptions.Item>
                                        ))}
                                    </Descriptions>
                                </>
                            )}

                            {payslip.notes && (
                                <>
                                    <Divider>{lang === 'ar' ? 'ملاحظات' : 'Notes'}</Divider>
                                    <Text>{payslip.notes}</Text>
                                </>
                            )}
                        </Card>

                        {/* Hidden component specifically for printing */}
                        <div style={{ display: 'none' }}>
                            <PayslipContent
                                ref={componentRef}
                                payslip={payslip}
                                selectedMonth={selectedMonth}
                                code={code}
                                lang={lang}
                            />
                        </div>
                    </>
                )}
            </div>
        </ConfigProvider>
    )
}