import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './Article.css';
import CommentBox from './ArticleComment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import formatDate from '../../../public Func/DateFix';
import globalVar from '../../../public Func/globalVar';
import axios from '../../../public Func/axiosAuth';

function ArticleBox({article}) {
    // Get current logged-in supervisor/admin ID
    const currentUserId = localStorage.getItem('id') || localStorage.getItem('supervisorID') || localStorage.getItem('supervisor_id');
    const currentRole = localStorage.getItem('role');
    const isCurrentUserSupervisor = currentRole === 'supervisor' || currentRole === 'Supervisor' || currentRole === 'super';
    // Check if this is supervisor's own article by comparing supervisorID
    const isOwnArticle = isCurrentUserSupervisor && article.isSupervisor && (
        (article.supervisorID && currentUserId && article.supervisorID.toString() === currentUserId.toString()) ||
        // Fallback: if supervisorID doesn't match but user is supervisor and article is by supervisor, show delete
        (article.isSupervisor && isCurrentUserSupervisor)
    );
    
    // Validate For admin, supervisor, or doctor
    var UserImage, UserName;
    if(article.isAdmin){
        UserImage= <div className='anonymous' style={{background: 'var(--primary-500)'}}>
                        <FontAwesomeIcon icon="fa-solid fa-user-shield" />
                    </div>
        UserName = article.doctorName || `Admin`
    }else if(article.isSupervisor){
        UserImage= <div className='anonymous' style={{background: 'var(--accent-purple)'}}>
                        <FontAwesomeIcon icon="fa-solid fa-user-tie" />
                    </div>
        UserName = article.doctorName || article.supervisorName || `Supervisor`
    }else{
        UserImage= <img src={article.doctorProfileImage} alt={article.doctorName + " Profile Pic"}/>
        UserName = article.doctorName
    }
    
    // AI Rating Colors
    var RateColor = 'rateGreen'
    if (Number(article.AI_saftyRate)<50){
        RateColor = 'rateRed'
    }else if (Number(article.AI_saftyRate)<75){
        RateColor = 'rateYellow'
    }


    // // Comments
    // var [SeeCommentButton,setButtonText] = useState("See Comments")
    // var [CommentButtenState,SetButtonState] = useState("enabled")
    // const [commentList,setCommentList] = useState([]) 
    // if (article.commentsNumber ==0){
    //     // SeeCommentButton   = "No Comments on This Article"
    //     // CommentButtenState = "disabled"
    // }

    //// Report Part
    const [somthingElse,setsomthingElse] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [selectedReason, setSelectedReason] = useState(null)

    // Hiding the Popup Window
    function hideReportForm(){
        setShowReportModal(false)
        setTimeout(() => {
            setsomthingElse(false)
            setshowErrorMessage(null)
            setSelectedReason(null)
        }, 300)
    }

    // Showing the Popup Window
    function ShowPopupReportForm(){
        setShowReportModal(true)
        setsomthingElse(false)
        setshowErrorMessage(null)
        setSelectedReason(null)
    }

    // Choose a Reason
    function SelectReportReason(event){
        const reason = event.currentTarget.innerHTML
        setSelectedReason(reason)
        if(reason === 'Somthing Else'){
            setsomthingElse(true)
        }else{
            setsomthingElse(false)
        }
    }

    // Submit the Form
    const [showErrorMessage,setshowErrorMessage] = useState(null)
    
    // Delete Article Part
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    function showDeleteConfirm(){
        setShowDeleteModal(true)
    }

    function hideDeleteModal(){
        setShowDeleteModal(false)
    }

    async function deleteArticle(){
        setIsDeleting(true)
        try{
            const res = await axios.delete(globalVar.backendURL + '/admin/article', {
                data: { articleID: article.id }
            })
            
            if(res.status === 200 && (res.data === 'Done' || res.data?.message === 'Done' || res.data?.done)){
                hideDeleteModal()
                const parent = document.getElementById(article.id)
                if (parent) {
                    parent.style.height = parent.scrollHeight + "px"
                    function hideScroll(){
                        parent.style.height = '0px'
                        parent.style.padding = '0px'
                        parent.style.margin = '0px auto'
                    }
                    function dissolve(){
                        parent.style.display = 'none'
                    }
                    setTimeout(hideScroll, 100)
                    setTimeout(dissolve, 2000)
                }
            } else {
                setshowErrorMessage('Failed to delete article. Please try again.')
            }
        } catch(err){
            console.error('Error deleting article:', err)
            setshowErrorMessage(err.response?.data || 'Failed to delete article. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    async function submitReportForm(event){
        var reason = ''
        // Data Reading and Validation
        if (selectedReason === null){
            setshowErrorMessage('You Have To Choose a Reason')
            return;
        }
        reason = selectedReason
        if (selectedReason === 'Somthing Else'){
            const inputValue = event.currentTarget.parentElement.querySelector("input").value
            if (inputValue ==''){
                setshowErrorMessage('You Have To Write a Reason')
                return
            }
            reason = inputValue
        }
        setshowErrorMessage(null)
        try{
            hideReportForm()

            const parent = document.getElementById(article.id)
            if (parent) {
                parent.style.height =  parent.scrollHeight+"px"
                function hideScroll(){
                    parent.style.height = '0px'
                    parent.style.padding = '0px'
                    parent.style.margin = '0px auto'
                }
                function dissolve(){
                    parent.style.display = 'none'
                }
                axios.delete(globalVar.backendURL+"/super/article",{data:{articleID:article.id,reason:reason}}).then((res)=>{
                    setTimeout(hideScroll, 100)
                    setTimeout(dissolve, 2000)
                }).catch((err)=>{
                    console.log("Error!!\n",err)
                })
            }
        }catch(err){
            console.log("Error!!\n",err)
        }

    }
    return (
        <div className="ArticleBox" id={article.id}>
            <span className='hidden articleID'>{article.id}</span>
            <div className='ArticleHeader'>
                <div  className='UserPic'>
                    {UserImage}
                    {article.isAdmin || article.isSupervisor || !article.doctorID ? '' : <a href={"./profile/doctor/"+article.doctorID} className='profileLink' target="_blank"></a>}
                </div>
                <div className='NameAndDateAndData'>
                    <div className='left'>
                        <p>{UserName} {article.edited? <span className='GrayText'>(edited)</span>:''}</p>
                        <span className='GrayText'>{formatDate(article.date)}</span>
                        <span className={'aiRate ' + RateColor} title="AI Safety Rating">
                            <FontAwesomeIcon icon="fa-solid fa-robot" /> {article.AI_saftyRate}% - ({article.AI_saftyWord})
                        </span>
                    </div>
                    <div className='Tags right'>
                        <span className='Community'>{article.category}</span>
                        {/* Show Delete button for admin's own articles or supervisor's own articles */}
                        {((article.isAdmin || article.adminEmail) || isOwnArticle) && (
                            <span className={'Delete' + (isDeleting ? ' disabled' : '')} onClick={showDeleteConfirm} style={{pointerEvents: isDeleting ? 'none' : 'auto'}}>
                                <FontAwesomeIcon icon={faTrash} style={{ marginRight: '0.25rem' }} />
                                Delete
                            </span>
                        )}
                        {/* Show Report button only if it's not the supervisor's own article and not admin's article */}
                        {!isOwnArticle && !(article.isAdmin || article.adminEmail) && (
                        <span className='Report' onClick={ShowPopupReportForm}>Report</span>
                        )}
                    </div>
                </div>
            </div>
            <div className='ArticleBody'>
                <div  className={'CoverImage '+(article.covorImage?'':'notShown')}>
                    <img src={globalVar.backendURL+"/file/"+article.covorImage} alt='Cover Image'/>
                </div>
                <h2>{article.title}</h2>
                <p>{article.mainText} ... </p>
                
            </div>
            <div className='ArticleReactions'>
                <div className='left'>
                    <span title='How Many Times the Article Was Displayed on a Screen'>
                        <FontAwesomeIcon icon="fa-solid fa-eye" /> {article.seenCount}
                    </span>
                
                </div>
                <div className='right'>
                    <span title='How Many People Reacted To This Article'>
                        <FontAwesomeIcon icon="fa-solid fa-heart" /> {article.upVotes}
                    </span>
                    <span title='Total Comment Number'>
                        <FontAwesomeIcon icon="fa-solid fa-comment" /> {article.commentsNumber}
                    </span>
                </div>
            </div>
            <div className='ArticleReadmoreButtons'>
                <a href={'/articles/'+article.id}><p>Read More</p></a>
            </div>

            {showReportModal && ReactDOM.createPortal(
                <div className='ReportPopupWindow'>
                    <div className='backgroundBlock' onClick={hideReportForm}></div>
                    <div className='ReportForm'>
                        <h1 className='TitleReport'>Report Article</h1>
                        <h3 className='ForNextArticle'>Article Title:</h3>
                        <p className='ReportMainArticleText'>{article.title}</p>
                        <div className='ReportTagOptions'>
                            <span className={'ReportTag' + (selectedReason === 'Spam' ? ' selected' : '')} onClick={SelectReportReason}>Spam</span>
                            <span className={'ReportTag' + (selectedReason === 'Nudity' ? ' selected' : '')} onClick={SelectReportReason}>Nudity</span>
                            <span className={'ReportTag' + (selectedReason === 'Scam' ? ' selected' : '')} onClick={SelectReportReason}>Scam</span>
                            <span className={'ReportTag' + (selectedReason === 'Illigal' ? ' selected' : '')} onClick={SelectReportReason}>Illigal</span>
                            <span className={'ReportTag' + (selectedReason === 'Sucide or Self-injury' ? ' selected' : '')} onClick={SelectReportReason}>Sucide or Self-injury</span>
                            <span className={'ReportTag' + (selectedReason === 'Violance' ? ' selected' : '')} onClick={SelectReportReason}>Violance</span>
                            <span className={'ReportTag' + (selectedReason === 'Hate Speech' ? ' selected' : '')} onClick={SelectReportReason}>Hate Speech</span>
                            <span className={'ReportTag' + (selectedReason === 'Somthing Else' ? ' selected' : '')} onClick={SelectReportReason}>Somthing Else</span>
                        </div>
                        <div className={'ReasonInputForm'+(somthingElse?" show":"")}>
                            <h2>Reason:</h2>
                            <p>Write a Simple Message For the Report Reason</p>
                            <input type='text' placeholder='Write the Message'/>
                        </div>
                        <button className='submutReportButton' onClick={submitReportForm}>Submit Report</button>
                        <p className={'ErrorMessage'+(showErrorMessage?" show":"")}>{showErrorMessage}</p>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && ReactDOM.createPortal(
                <div className='ReportPopupWindow'>
                    <div className='backgroundBlock' onClick={hideDeleteModal}></div>
                    <div className='ReportForm'>
                        <h1 className='TitleReport'>Delete Article</h1>
                        <h3 className='ForNextArticle'>Are you sure you want to delete this article?</h3>
                        <p className='ReportMainArticleText'>{article.title}</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className='submutReportButton' onClick={hideDeleteModal} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}>
                                Cancel
                            </button>
                            <button className='submutReportButton' onClick={deleteArticle} disabled={isDeleting} style={{ background: 'var(--danger-500)', flex: 1 }}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                        {showErrorMessage && (
                            <p className={'ErrorMessage show'}>{showErrorMessage}</p>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
  );
}

export default ArticleBox;